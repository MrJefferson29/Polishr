import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaPaperPlane,
  FaRegBookmark,
  FaEllipsisH,
  FaImage,
} from 'react-icons/fa';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import ImageCarousel from './common/ImageCarousel';

const Page = styled.div`
  min-height: 100vh;
  background: #fafafa;
  padding: 1rem 0 4rem;
`;

const Inner = styled.div`
  max-width: 470px;
  margin: 0 auto;
  padding: 0;
`;

const TopBar = styled.header`
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 0;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  text-align: center;

  h1 {
    margin: 0;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #262626;
  }
`;

const Composer = styled.div`
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const ComposerTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.75rem;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  span {
    font-weight: 600;
    font-size: 0.875rem;
    color: #262626;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 72px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  resize: none;
  font-family: inherit;
  color: #262626;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: #8e8e8e;
  }
`;

const ComposerActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px solid #efefef;
`;

const IconBtn = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #262626;
  cursor: pointer;
  margin: 0;

  input {
    display: none;
  }
`;

const PostBtn = styled.button`
  border: none;
  background: none;
  color: #0095f6;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};

  &:disabled {
    cursor: not-allowed;
  }
`;

const PreviewRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 0.65rem;
  overflow-x: auto;

  img {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #dbdbdb;
  }
`;

const PostCard = styled.article`
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  margin-bottom: 1.25rem;
  overflow: hidden;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1rem;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #efefef;
  }

  .meta {
    flex: 1;
    min-width: 0;
  }

  .username {
    font-size: 0.875rem;
    font-weight: 600;
    color: #262626;
    line-height: 1.2;
  }

  .salon {
    font-size: 0.75rem;
    color: #8e8e8e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  button {
    border: none;
    background: none;
    color: #262626;
    padding: 4px;
    cursor: pointer;
  }
`;

const MediaWrap = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #000;
  position: relative;

  > div {
    height: 100% !important;
  }
`;

const PostActions = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.85rem 0.35rem;
  gap: 0.85rem;

  button {
    border: none;
    background: none;
    padding: 0;
    font-size: 1.35rem;
    color: #262626;
    cursor: pointer;
    line-height: 1;
    display: flex;
    align-items: center;
  }

  .spacer {
    flex: 1;
  }
`;

const PostBody = styled.div`
  padding: 0 1rem 0.85rem;
`;

const Caption = styled.p`
  margin: 0 0 0.35rem;
  font-size: 0.875rem;
  line-height: 1.45;
  color: #262626;
  white-space: pre-wrap;

  strong {
    font-weight: 600;
    margin-right: 0.35rem;
  }
`;

const PostTime = styled.time`
  display: block;
  font-size: 0.65rem;
  color: #8e8e8e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 0.35rem;
`;

const ErrorBanner = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.65rem 0.85rem;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
`;

const EmptyState = styled.div`
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  padding: 3rem 1.5rem;
  text-align: center;

  p {
    color: #8e8e8e;
    margin: 0 0 1rem;
    font-size: 0.9rem;
  }
`;

const ExploreBtn = styled.button`
  padding: 0.55rem 1.15rem;
  border-radius: 8px;
  border: none;
  background: #0095f6;
  color: #fff;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
`;

const LoadingWrap = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MAX_POST_IMAGES = 4;

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffHours < 48) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const Feed = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState({});

  const loadFeed = async () => {
    try {
      const { data } = await postsAPI.getFeed();
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadFeed();
  }, [isAuthenticated, navigate]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_POST_IMAGES);
    if (files.length < (e.target.files?.length || 0)) {
      setError(`You can attach up to ${MAX_POST_IMAGES} images per post.`);
    } else {
      setError('');
    }
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', content);
      images.forEach((file) => formData.append('images', file));
      await postsAPI.create(formData);
      setContent('');
      setImages([]);
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
      await loadFeed();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = (id) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <Page>
        <LoadingWrap>
          <Spinner animation="border" style={{ color: '#262626' }} />
        </LoadingWrap>
      </Page>
    );
  }

  const canPost = user?.role === 'host' || user?.role === 'admin';
  const userAvatar =
    user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'
    )}&size=64&background=262626&color=fff`;

  return (
    <Page>
      <Inner>
        <TopBar>
          <h1>NailBook</h1>
        </TopBar>

        {canPost && (
          <Composer>
            <form onSubmit={handleCreatePost}>
              {error && <ErrorBanner>{error}</ErrorBanner>}
              <ComposerTop>
                <img src={userAvatar} alt="" />
                <span>{user?.firstName || 'You'}</span>
              </ComposerTop>
              <TextArea
                placeholder="Write a caption..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
              {previews.length > 0 && (
                <PreviewRow>
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt="" />
                  ))}
                </PreviewRow>
              )}
              <ComposerActions>
                <IconBtn>
                  <FaImage />
                  {images.length}/{MAX_POST_IMAGES}
                  <input type="file" accept="image/*" multiple onChange={handleFiles} />
                </IconBtn>
                <PostBtn type="submit" disabled={posting || !content.trim()} $disabled={posting || !content.trim()}>
                  {posting ? 'Sharing…' : 'Share'}
                </PostBtn>
              </ComposerActions>
            </form>
          </Composer>
        )}

        {posts.length === 0 && (
          <EmptyState>
            <p>No posts yet. Follow salons to see their updates here.</p>
            <ExploreBtn type="button" onClick={() => navigate('/')}>
              Explore salons
            </ExploreBtn>
          </EmptyState>
        )}

        {posts.map((post) => {
          const authorName = `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'User';
          const avatar =
            post.author?.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&size=64&background=e91e63&color=fff`;
          const isLiked = liked[post._id];

          return (
            <PostCard key={post._id}>
              <PostHeader>
                <img src={avatar} alt="" />
                <div className="meta">
                  <div className="username">{authorName}</div>
                  {post.salon?.name && <div className="salon">{post.salon.name}</div>}
                </div>
                <button type="button" aria-label="More options">
                  <FaEllipsisH />
                </button>
              </PostHeader>

              {post.images?.length > 0 && (
                <MediaWrap>
                  <ImageCarousel
                    images={post.images}
                    height="100%"
                    shuffle={false}
                    objectFit="cover"
                    framePadding={0}
                    showNav={post.images.length > 1}
                    showDots={post.images.length > 1}
                    enableSwipe
                  />
                </MediaWrap>
              )}

              <PostActions>
                <button type="button" onClick={() => toggleLike(post._id)} aria-label="Like">
                  {isLiked ? <FaHeart style={{ color: '#ed4956' }} /> : <FaRegHeart />}
                </button>
                <button type="button" aria-label="Comment">
                  <FaRegComment />
                </button>
                <button type="button" aria-label="Share">
                  <FaPaperPlane />
                </button>
                <span className="spacer" />
                <button type="button" aria-label="Save">
                  <FaRegBookmark />
                </button>
              </PostActions>

              <PostBody>
                {isLiked && (
                  <Caption style={{ marginBottom: '0.25rem', fontWeight: 600 }}>
                    1 like
                  </Caption>
                )}
                <Caption>
                  <strong>{authorName}</strong>
                  {post.content}
                </Caption>
                <PostTime dateTime={post.createdAt}>{formatTime(post.createdAt)}</PostTime>
              </PostBody>
            </PostCard>
          );
        })}
      </Inner>
    </Page>
  );
};

export default Feed;
