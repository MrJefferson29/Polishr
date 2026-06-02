import React, { useState, useEffect } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { followsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FollowButton = ({ hostId, size = 'sm' }) => {
  const { isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !hostId) {
      setLoading(false);
      return;
    }
    followsAPI.checkFollowing(hostId)
      .then(({ data }) => setIsFollowing(data.isFollowing))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hostId, isAuthenticated]);

  const toggle = async () => {
    if (!isAuthenticated) return;
    setBusy(true);
    try {
      if (isFollowing) {
        await followsAPI.unfollow(hostId);
        setIsFollowing(false);
      } else {
        await followsAPI.follow(hostId);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthenticated || loading) return null;

  return (
    <Button
      variant={isFollowing ? 'outline-danger' : 'danger'}
      size={size}
      onClick={toggle}
      disabled={busy}
      className="rounded-pill"
    >
      {busy ? <Spinner size="sm" animation="border" /> : isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};

export default FollowButton;
