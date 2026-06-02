const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./connectDB');
const IndexRoute = require('./routes/index');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const http = require('http');
const socketio = require('socket.io');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import models to ensure they are registered with Mongoose
require('./models/user');
require('./models/salon');
require('./models/appointment');
require('./models/payment');
require('./models/HostApplication');
require('./models/notification');
require('./models/chat');
require('./models/review');
require('./models/follow');
require('./models/post');

const { startAppointmentStatusScheduler, runInitialStatusCheck } = require('./services/appointmentStatusScheduler');
const { startDailyPayoutProcessor } = require('./services/delayedPayoutProcessor');

dotenv.config({ path: './.env' });

const app = express();
connectDB();

// Start schedulers after database connection
connectDB().then(async () => {
  console.log('🚀 Starting appointment status scheduler...');
  startAppointmentStatusScheduler();
  await runInitialStatusCheck();
  console.log('✅ Appointment status scheduler started');
  
  // Start daily payout processor
  console.log('🚀 Starting daily payout processor...');
  startDailyPayoutProcessor();
  console.log('✅ Daily payout processor started');
}).catch(err => {
  console.error('❌ Failed to start schedulers:', err);
});

// Passport configuration
require('./config/passport');

// Stripe Webhook must use raw body parser
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('📋 Webhook received:', event.type);
      console.log('📋 Event ID:', event.id);

      // Handle Connect events (events on connected accounts)
      if (event.account) {
        console.log('🔗 Connect webhook event for account:', event.account);
        console.log('📋 Event type:', event.type);
        
        // Handle Connect-specific events
        if (event.type === 'account.updated') {
          console.log('✅ Connected account updated:', event.account);
          // You can add logic here to sync account status changes
        }
        
        if (event.type === 'account.external_account.updated') {
          console.log('✅ Connected account external account updated:', event.account);
          // Handle bank account updates
        }
        
        if (event.type === 'payout.failed') {
          console.log('❌ Connected account payout failed:', event.account);
          // Handle payout failures
        }
      }

      // Handle checkout session completion
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('✅ Checkout session completed:', session.id);
        console.log('📋 Session metadata:', session.metadata);
        console.log('📋 Payment status:', session.payment_status);
        console.log('📋 Session status:', session.status);

        // Find booking by payment session ID
        const Appointment = require('./models/appointment');
        const Payment = require('./models/payment');
        const HostApplication = require('./models/HostApplication');
        const Salon = require('./models/salon');

        try {
          const appointment = await Appointment.findOne({ paymentSessionId: session.id });

          if (!appointment) {
            console.log('⚠️ No appointment found for session:', session.id);
            return res.json({ received: true });
          }

          const salon = await Salon.findById(appointment.salon).populate('owner');
          if (!salon) {
            console.log('❌ No salon found for appointment:', appointment._id);
            return res.json({ received: true });
          }

          const hostApplication = await HostApplication.findOne({
            user: salon.owner._id,
            status: 'approved',
          });

          if (!hostApplication?.stripeConnect?.accountId) {
            console.log('❌ No Stripe Connect account for host:', salon.owner._id);
            return res.json({ received: true });
          }

          await Appointment.findByIdAndUpdate(appointment._id, {
            status: 'confirmed',
            paymentStatus: 'completed',
            updatedAt: new Date(),
          }, { new: true });

          const payment = await Payment.findOne({ stripeSessionId: session.id });
          if (payment) {
            await Payment.findByIdAndUpdate(payment._id, {
              status: 'completed',
              transactionId: session.payment_intent,
              stripePaymentIntentId: session.payment_intent,
              payoutMethod: 'stripe_connect',
              payoutStatus: 'pending',
              completedAt: new Date(),
              metadata: {
                ...(payment.metadata || {}),
                stripeSessionId: session.id,
                webhookProcessed: true,
                webhookEventId: event.id,
              },
            });
          } else {
            await Payment.create({
              user: appointment.user,
              appointment: appointment._id,
              amount: Math.round(session.amount_total / 100),
              currency: session.currency || 'usd',
              status: 'completed',
              paymentMethod: session.metadata?.paymentMethod || 'card',
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              transactionId: session.payment_intent,
              payoutMethod: 'stripe_connect',
              payoutStatus: 'pending',
              metadata: { createdViaWebhook: true, webhookEventId: event.id },
            });
          }

          try {
            const NotificationService = require('./services/notificationService');
            await NotificationService.createAppointmentNotification(appointment._id, 'appointment_confirmed');
          } catch (notificationError) {
            console.error('Notification error:', notificationError);
          }

        } catch (error) {
          console.error('❌ Error updating booking/payment:', error);
          console.error('❌ Error stack:', error.stack);
        }
      }

      // Handle payment intent events for additional payment status updates
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log('✅ Payment intent succeeded:', paymentIntent.id);

        // Find payment by payment intent ID
        const Payment = require('./models/payment');
        try {
          const payment = await Payment.findOne({ 
            'metadata.stripePaymentIntentId': paymentIntent.id 
          });

          if (payment) {
            console.log('✅ Found payment for payment intent:', payment._id);
            
            // Update payment with additional details
            await Payment.findByIdAndUpdate(payment._id, {
              status: 'completed',
              transactionId: paymentIntent.id,
              completedAt: new Date(),
              metadata: {
                ...(payment.metadata || {}),
                paymentIntentStatus: paymentIntent.status,
                webhookProcessed: true,
                webhookEventId: event.id,
                webhookProcessedAt: new Date()
              }
            });

            console.log('✅ Payment updated with payment intent details');
          } else {
            console.log('⚠️ No payment found for payment intent:', paymentIntent.id);
          }
        } catch (error) {
          console.error('❌ Error updating payment with payment intent:', error);
        }
      }

      // Handle payment intent capture (when we manually capture the payment)
      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        console.log('❌ Payment intent failed:', paymentIntent.id);

        // Find payment and update status
        const Payment = require('./models/payment');
        try {
          const payment = await Payment.findOne({ 
            'metadata.stripePaymentIntentId': paymentIntent.id 
          });

          if (payment) {
            console.log('✅ Found payment for failed payment intent:', payment._id);
            
            // Update payment status to failed
            await Payment.findByIdAndUpdate(payment._id, {
              status: 'failed',
              failedAt: new Date(),
              metadata: {
                ...(payment.metadata || {}),
                paymentIntentStatus: paymentIntent.status,
                failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
                webhookProcessed: true,
                webhookEventId: event.id,
                webhookProcessedAt: new Date()
              }
            });

            const Appointment = require('./models/appointment');
            const appointment = await Appointment.findById(payment.appointment);
            if (appointment) {
              await Appointment.findByIdAndUpdate(appointment._id, {
                status: 'cancelled',
                paymentStatus: 'failed',
                updatedAt: new Date(),
              });
            }

            console.log('✅ Payment updated with failure details');
          }
        } catch (error) {
          console.error('❌ Error updating failed payment:', error);
        }
      }

      // Handle transfer events (when money is transferred to host)
      if (event.type === 'transfer.created') {
        const transfer = event.data.object;
        console.log('✅ Transfer created:', transfer.id);
        console.log('📋 Transfer amount:', transfer.amount);
        console.log('📋 Transfer destination:', transfer.destination);
        
        // Find payment by transfer destination (host account)
        const Payment = require('./models/payment');
        try {
          const payment = await Payment.findOne({ 
            'metadata.stripeTransferId': transfer.id 
          });

          if (payment) {
            console.log('✅ Found payment for transfer:', payment._id);
            
            // Update payment with transfer details
            await Payment.findByIdAndUpdate(payment._id, {
              transferStatus: 'completed',
              transferCompletedAt: new Date(),
              stripeTransferId: transfer.id,
              metadata: {
                ...(payment.metadata || {}),
                transferId: transfer.id,
                transferAmount: transfer.amount,
                transferCurrency: transfer.currency,
                webhookProcessed: true,
                webhookEventId: event.id,
                webhookProcessedAt: new Date()
              }
            });

            console.log('✅ Payment updated with transfer details');
          }
        } catch (error) {
          console.error('❌ Error updating payment with transfer:', error);
        }
      }

      // Handle transfer completion events (when transfer is fully processed)
      if (event.type === 'transfer.paid') {
        const transfer = event.data.object;
        console.log('✅ Transfer paid:', transfer.id);
        console.log('📋 Transfer amount:', transfer.amount);
        console.log('📋 Transfer destination:', transfer.destination);
        
        // Find payment by transfer ID
        const Payment = require('./models/payment');
        const Appointment = require('./models/appointment');
        
        try {
          const payment = await Payment.findOne({ 
            stripeTransferId: transfer.id 
          });

          if (payment) {
            console.log('✅ Found payment for completed transfer:', payment._id);
            
            // Update payment payout status to completed
            await Payment.findByIdAndUpdate(payment._id, {
              payoutStatus: 'completed',
              payoutCompletedAt: new Date(),
              metadata: {
                ...(payment.metadata || {}),
                transferPaid: true,
                transferPaidAt: new Date(),
                webhookProcessed: true,
                webhookEventId: event.id,
                webhookProcessedAt: new Date()
              }
            });

            console.log('✅ Payment payout status updated to completed');
            
            // Update corresponding booking payout status to keep in sync
            try {
              const updatedAppointment = await Appointment.findByIdAndUpdate(payment.appointment, {
                payoutStatus: 'completed',
                updatedAt: new Date(),
              }, { new: true });

              if (updatedAppointment) {
                console.log(`✅ Appointment ${payment.appointment} payout status updated to completed`);
              }
            } catch (appointmentUpdateError) {
              console.error(`⚠️ Error updating appointment payout status:`, appointmentUpdateError.message);
            }
          } else {
            console.log('⚠️ No payment found for transfer:', transfer.id);
          }
        } catch (error) {
          console.error('❌ Error updating payment with transfer completion:', error);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error('❌ Webhook Error:', err.message);
      console.error('❌ Webhook Error Stack:', err.stack);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Webhook health check endpoint
app.get('/webhook-health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'missing',
    stripeKey: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
    webhookEndpoint: '/webhook',
    environment: process.env.NODE_ENV || 'development'
  });
});

// JSON parser for all other routes
app.use(express.json());
app.use(morgan('dev'));
// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
    'https://driv-inn.vercel.app',
  ].filter(Boolean),
  credentials: true,
}));

// Session configuration for OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/', IndexRoute);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  'https://driv-inn.vercel.app',
].filter(Boolean);

const io = socketio(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ chatRoomId }) => {
    socket.join(chatRoomId);
  });

  socket.on('sendMessage', (msg) => {
    if (msg.type === 'location') {
      io.to(msg.chatRoomId).emit('receiveMessage', msg);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});