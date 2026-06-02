import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/api';

const Bg = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;
const Card = styled.div`
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.1);
  padding: 40px 28px;
  max-width: 440px;
  width: 100%;
`;
const ProfileImageWrapper = styled.div`
  position: relative;
  margin: 0 auto 18px;
  width: 120px;
`;
const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e0e7ef;
`;
const ChangeImageButton = styled.label`
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: var(--color-primary, #2563eb);
  color: #fff;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid #fff;
`;
const HiddenInput = styled.input`
  display: none;
`;
const Title = styled.h2`
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 20px;
`;
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1.5px solid #e0e7ef;
  font-size: 1rem;
`;
const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 4px;
  display: block;
`;
const Button = styled.button`
  background: var(--color-primary, #2563eb);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  &:disabled {
    opacity: 0.6;
  }
`;
const ErrorMsg = styled.div`
  color: #b91c1c;
  background: #fef2f2;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.9rem;
`;

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    user?.profileImage ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        `${user?.firstName || ''} ${user?.lastName || ''}`
      )}&size=120&background=2563eb&color=fff`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!user) return <ErrorMsg>Please log in to edit your profile.</ErrorMsg>;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userId = user._id || user.id;
      let updatedUser = { ...user, firstName, lastName, email, phoneNumber };

      const updates = {};
      if (firstName !== user.firstName) updates.firstName = firstName;
      if (lastName !== user.lastName) updates.lastName = lastName;
      if (email !== user.email) updates.email = email;
      if (phoneNumber !== (user.phoneNumber || '')) updates.phoneNumber = phoneNumber;

      if (Object.keys(updates).length > 0) {
        const res = await usersAPI.updateProfile(userId, updates);
        updatedUser = res.data?.user || res.data || { ...updatedUser, ...updates };
      }

      if (profileImageFile) {
        const formData = new FormData();
        formData.append('image', profileImageFile);
        const imgRes = await usersAPI.uploadProfileImage(userId, formData);
        if (imgRes.data?.user) {
          updatedUser = imgRes.data.user;
        } else if (imgRes.data?.profileImage) {
          updatedUser = { ...updatedUser, profileImage: imgRes.data.profileImage };
        }
      }

      updateUser(updatedUser);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Bg>
      <Card>
        <Title>Edit profile</Title>
        <ProfileImageWrapper>
          <ProfileImage src={imagePreview} alt="Profile" />
          <ChangeImageButton htmlFor="profileImage" title="Change photo">
            📷
            <HiddenInput id="profileImage" type="file" accept="image/*" onChange={handleImageChange} />
          </ChangeImageButton>
        </ProfileImageWrapper>
        <Form onSubmit={handleSubmit}>
          <div>
            <Label>First name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <Label>Last name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+237 6XX XXX XXX"
            />
          </div>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
          <Button
            type="button"
            style={{ background: '#e2e8f0', color: '#334155' }}
            onClick={() => navigate('/profile')}
          >
            Cancel
          </Button>
        </Form>
      </Card>
    </Bg>
  );
};

export default EditProfile;
