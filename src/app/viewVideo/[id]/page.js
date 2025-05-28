'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Modal, Form } from 'react-bootstrap';

export default function ViewVideoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [video, setVideo] = useState(null);
  const [videoUrls, setVideoUrls] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [editUrlModal, setEditUrlModal] = useState(false);
  const [editUrlData, setEditUrlData] = useState({ id: '', platformId: '', url: '' });

  const [editData, setEditData] = useState({
    title: '',
    description: '',
    genre: '',
    releaseYear: '',
    status: '',
    rating: '',
  });

  const [newUrlData, setNewUrlData] = useState({ platformId: '', url: '' });

  const [episodes, setEpisodes] = useState([]);
  const [episodeFilter, setEpisodeFilter] = useState('');
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [newEpisode, setNewEpisode] = useState({
    name: '',
    status: '',
    rating: '',
    season: '',
    episodeNumber: '',
    timeStopped: '',
  });
  const [showEditEpisodeModal, setShowEditEpisodeModal] = useState(false);
  const [editEpisodeData, setEditEpisodeData] = useState({
    id: '',
    name: '',
    status: '',
    rating: '',
    season: '',
    episodeNumber: '',
    timeStopped: '',
  });

  useEffect(() => {
    if (!id) return;
    const fetchEpisodes = async () => {
      try {
        const res = await fetch(`http://localhost:5193/api/Episodes/video/${id}`);
        if (!res.ok) throw new Error('Failed to fetch episodes');
        const data = await res.json();
        const sorted = [...data].sort((a, b) => {
          // Handle season nulls or zeros
          const seasonA = a.season ?? 0;
          const seasonB = b.season ?? 0;

          // Push season 0 to the bottom
          if (seasonA === 0 && seasonB !== 0) return 1;
          if (seasonB === 0 && seasonA !== 0) return -1;

          // Sort by season then episode number
          if (seasonA !== seasonB) return seasonA - seasonB;
          return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
        });
        setEpisodes(sorted);
      } catch (error) {
        console.error(error);
      }
    };

    fetchEpisodes();

    const fetchData = async () => {
      try {
        const [videoRes, platformRes] = await Promise.all([fetch(`http://localhost:5193/api/Videos/${id}`), fetch(`http://localhost:5193/api/Platforms`)]);

        if (!videoRes.ok || !platformRes.ok) throw new Error('Failed to fetch resources');

        const videoData = await videoRes.json();
        const platformData = await platformRes.json();

        setVideo(videoData);
        setPlatforms(platformData.$values || []);
        setEditData({
          title: videoData.title,
          description: videoData.description,
          genre: videoData.genre,
          releaseYear: videoData.releaseYear,
          status: videoData.status,
          rating: videoData.rating,
        });

        // eslint-disable-next-line no-use-before-define
        await refreshVideoUrls(); // Load URLs after video/platforms
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [id]);

  const fetchEpisodes = async () => {
    try {
      const res = await fetch(episodeFilter ? `http://localhost:5193/api/Episodes/status/${episodeFilter}` : `http://localhost:5193/api/Episodes/video/${id}`);

      if (!res.ok) throw new Error('Failed to fetch episodes');
      const data = await res.json();

      // Filter to only this video if filtering by status (that endpoint returns all users' episodes of that status)
      let episodesData = data.$values || [];
      if (episodeFilter) {
        episodesData = episodesData.filter((e) => e.videoId.toString() === id.toString());
      }

      // ✅ Sort: Push Season 0 to the bottom, then by season and episode number
      const sorted = [...episodesData].sort((a, b) => {
        const seasonA = a.season ?? 0;
        const seasonB = b.season ?? 0;

        if (seasonA === 0 && seasonB !== 0) return 1;
        if (seasonB === 0 && seasonA !== 0) return -1;

        if (seasonA !== seasonB) return seasonA - seasonB;
        return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
      });

      setEpisodes(sorted);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) fetchEpisodes();
  }, [id, episodeFilter]);

  const handleAddEpisode = async () => {
    try {
      const payload = {
        videoId: video.id,
        userId: video.userId,
        ...newEpisode,
        season: parseInt(newEpisode.season, 10),
        episodeNumber: parseInt(newEpisode.episodeNumber, 10),
        rating: parseInt(newEpisode.rating, 10),
      };

      const res = await fetch('http://localhost:5193/api/Episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create episode');
      setShowEpisodeModal(false);
      setNewEpisode({ name: '', status: '', rating: '', season: '', episodeNumber: '', timeStopped: '' });
      fetchEpisodes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditEpisodeSubmit = async () => {
    try {
      const payload = {
        ...editEpisodeData,
        videoId: video.id,
        userId: video.userId,
        season: parseInt(editEpisodeData.season, 10),
        episodeNumber: parseInt(editEpisodeData.episodeNumber, 10),
        rating: parseInt(editEpisodeData.rating, 10),
      };

      const res = await fetch(`http://localhost:5193/api/Episodes/${editEpisodeData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update episode');

      setShowEditEpisodeModal(false);
      fetchEpisodes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEpisode = async (episodeId) => {
    const confirmed = window.confirm('Are you sure you want to delete this episode?');
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5193/api/Episodes/${episodeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete episode');
      fetchEpisodes();
    } catch (error) {
      console.error(error);
    }
  };

  const refreshVideoUrls = async () => {
    try {
      const res = await fetch(`http://localhost:5193/api/VideoUrls/video/${id}`);
      if (!res.ok) throw new Error('Failed to fetch URLs');
      const urlData = await res.json();
      setVideoUrls(urlData.$values || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditSubmit = async () => {
    try {
      const payload = {
        ...editData,
        releaseYear: parseInt(editData.releaseYear, 10),
        rating: parseInt(editData.rating, 10),
        userId: video.userId,
        id: video.id,
      };

      const res = await fetch(`http://localhost:5193/api/Videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update video');

      const updated = res.status === 204 ? payload : await res.json();
      setVideo(updated);
      setShowEditModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this video? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5193/api/Videos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete video');
      router.push('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddUrl = async () => {
    try {
      const payload = {
        videoId: video.id,
        platformId: parseInt(newUrlData.platformId, 10),
        url: newUrlData.url,
      };

      const res = await fetch('http://localhost:5193/api/VideoUrls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to add video URL');

      await refreshVideoUrls();
      setShowUrlModal(false);
      setNewUrlData({ platformId: '', url: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUrl = async (urlId) => {
    const confirmed = window.confirm('Are you sure you want to delete this streaming URL?');
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5193/api/VideoUrls/${urlId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete URL');

      await refreshVideoUrls();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditUrlSubmit = async () => {
    try {
      const payload = {
        id: editUrlData.id,
        videoId: video.id,
        platformId: parseInt(editUrlData.platformId, 10),
        url: editUrlData.url,
      };

      const res = await fetch(`http://localhost:5193/api/VideoUrls/${editUrlData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update URL');

      await refreshVideoUrls();
      setEditUrlModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (!video) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <main className="flex flex-col items-center justify-start p-4 min-h-screen bg-black text-white">
      <div className="w-full max-w-2xl">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{video.title}</h1>
        </header>

        <p className="mb-2 text-sm text-gray-300">
          {video.genre} • {video.releaseYear}
        </p>
        <p className="mb-4 text-base text-white">{video.description}</p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Button variant="secondary" onClick={() => setShowEditModal(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>

        {/* Edit Video Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Edit Video</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {['title', 'description', 'genre', 'releaseYear', 'rating', 'status'].map((field) => (
              <Form.Group key={field} className="mb-2">
                <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
                <Form.Control type={['releaseYear', 'rating'].includes(field) ? 'number' : 'text'} value={editData[field]} onChange={(e) => setEditData({ ...editData, [field]: e.target.value })} />
              </Form.Group>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleEditSubmit}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Where to Watch */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Where To Watch</h2>
          <Button variant="primary" className="mb-2" onClick={() => setShowUrlModal(true)}>
            Add URL
          </Button>

          <Modal show={showUrlModal} onHide={() => setShowUrlModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Add Streaming URL</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label>Platform</Form.Label>
                <Form.Select value={newUrlData.platformId} onChange={(e) => setNewUrlData({ ...newUrlData, platformId: e.target.value })}>
                  <option value="">Select a platform</option>
                  {platforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>URL</Form.Label>
                <Form.Control type="url" placeholder="https://example.com" value={newUrlData.url} onChange={(e) => setNewUrlData({ ...newUrlData, url: e.target.value })} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowUrlModal(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleAddUrl}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Edit URL Modal */}
          <Modal show={editUrlModal} onHide={() => setEditUrlModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Edit Streaming URL</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label>Platform</Form.Label>
                <Form.Select value={editUrlData.platformId} onChange={(e) => setEditUrlData({ ...editUrlData, platformId: e.target.value })}>
                  <option value="">Select a platform</option>
                  {platforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>URL</Form.Label>
                <Form.Control type="url" value={editUrlData.url} onChange={(e) => setEditUrlData({ ...editUrlData, url: e.target.value })} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setEditUrlModal(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleEditUrlSubmit}>
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>

          {videoUrls.length > 0 ? (
            videoUrls.map((url) => (
              <div key={url.id} className="bg-gray-800 p-2 rounded mb-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <a href={url.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all">
                    {url.platform?.name || 'Unknown Platform'}
                  </a>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditUrlData({
                          id: url.id,
                          url: url.url,
                          platformId: url.platformId.toString(),
                        });
                        setEditUrlModal(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteUrl(url.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No URLs added yet.</p>
          )}
        </section>

        {/* EPISODES SECTION */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Episodes</h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <select className="p-2 border rounded w-full sm:w-auto" value={episodeFilter} onChange={(e) => setEpisodeFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Watched">Watched</option>
              <option value="Watching">Watching</option>
              <option value="Not Watched">Not Watched</option>
            </select>
            <Button variant="primary" className="w-full sm:w-auto" onClick={() => setShowEpisodeModal(true)}>
              Add Episode
            </Button>
          </div>

          <Modal show={showEpisodeModal} onHide={() => setShowEpisodeModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Add Episode</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {['name', 'status', 'rating', 'season', 'episodeNumber', 'timeStopped'].map((field) => (
                <Form.Group key={field} className="mb-2">
                  <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
                  <Form.Control type={['rating', 'season', 'episodeNumber'].includes(field) ? 'number' : 'text'} value={newEpisode[field]} onChange={(e) => setNewEpisode({ ...newEpisode, [field]: e.target.value })} />
                </Form.Group>
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEpisodeModal(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleAddEpisode}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>
          <Modal show={showEditEpisodeModal} onHide={() => setShowEditEpisodeModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Edit Episode</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {['name', 'status', 'rating', 'season', 'episodeNumber', 'timeStopped'].map((field) => (
                <Form.Group key={field} className="mb-2">
                  <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
                  <Form.Control type={['rating', 'season', 'episodeNumber'].includes(field) ? 'number' : 'text'} value={editEpisodeData[field]} onChange={(e) => setEditEpisodeData({ ...editEpisodeData, [field]: e.target.value })} />
                </Form.Group>
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditEpisodeModal(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleEditEpisodeSubmit}>
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>
          {episodes.length > 0 ? (
            episodes.map((ep) => (
              <div key={ep.id} className="bg-white text-black p-2 rounded mb-1">
                <h3 className="text-md font-bold">{ep.name}</h3>
                <p className="text-sm">
                  Time: {ep.timeStopped} | Season {ep.season} • Episode {ep.episodeNumber}
                </p>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditEpisodeData({ ...ep });
                      setShowEditEpisodeModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteEpisode(ep.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No episodes found.</p>
          )}
        </section>
      </div>
    </main>
  );
}
