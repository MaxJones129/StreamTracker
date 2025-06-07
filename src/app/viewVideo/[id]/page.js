'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Modal, Form } from 'react-bootstrap';
import styles from '../../../styles/ViewPage.module.css';

export default function ViewVideoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [video, setVideo] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const [episodes, setEpisodes] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [episodeFilter, setEpisodeFilter] = useState('');
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [newEpisode, setNewEpisode] = useState({});
  const [showEditEpisodeModal, setShowEditEpisodeModal] = useState(false);
  const [editEpisodeData, setEditEpisodeData] = useState({});
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [editUrlModal, setEditUrlModal] = useState(false);
  const [newUrlData, setNewUrlData] = useState({});
  const [editUrlData, setEditUrlData] = useState({});

  const handleDeleteEpisode = async (episodeId) => {
    const confirmed = window.confirm('Are you sure you want to delete this episode?');
    if (!confirmed) return;

    await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Episodes/${episodeId}`, { method: 'DELETE' });
    const res = await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Episodes/video/${id}`);
    const data = await res.json();
    setEpisodes(
      (data.$values || []).sort((a, b) => {
        if (a.season === 0 && b.season !== 0) return 1;
        if (b.season === 0 && a.season !== 0) return -1;
        const seasonCompare = (a.season ?? 0) - (b.season ?? 0);
        if (seasonCompare !== 0) return seasonCompare;
        return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
      }),
    );
  };

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      const [videoRes, platformsRes, urlsRes] = await Promise.all([fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Videos/${id}`), fetch('https://streamtracker-be-9d38b309655b.herokuapp.com/api/Platforms'), fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/VideoUrls/video/${id}`)]);
      const [videoData, platformsData, urlsData] = await Promise.all([videoRes.json(), platformsRes.json(), urlsRes.json()]);
      setVideo(videoData);
      setEditData(videoData);
      setPlatforms(platformsData.$values || []);
      setVideoUrls(urlsData.$values || []);
    };
    fetchAll();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchEpisodes = async () => {
      const url = episodeFilter ? `https://streamtracker-be-9d38b309655b.herokuapp.com/api/Episodes/status/${episodeFilter}` : `https://streamtracker-be-9d38b309655b.herokuapp.com/api/Episodes/video/${id}`;
      const res = await fetch(url);
      const data = await res.json();
      const filtered = episodeFilter ? data.$values.filter((ep) => ep.videoId.toString() === id.toString()) : data.$values;
      setEpisodes(
        (filtered || []).sort((a, b) => {
          if (a.season === 0 && b.season !== 0) return 1;
          if (b.season === 0 && a.season !== 0) return -1;
          const seasonCompare = (a.season ?? 0) - (b.season ?? 0);
          if (seasonCompare !== 0) return seasonCompare;
          return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
        }),
      );
    };
    fetchEpisodes();
  }, [id, episodeFilter]);

  if (!video) return <p className="text-center text-[#5e2b1b] mt-10">Loading...</p>;

  return (
    <main className="flex flex-col items-center px-4 py-8 min-h-screen bg-[#fdf3e7] text-[#5e2b1b]">
      <div className={`${styles.container} flex flex-col lg:flex-row gap-6 w-full`}>
        <div className={styles.showInfoWrapper}>
          <h1 className={styles.title}>{video.title}</h1>
          <p className={styles.subtitle}>
            {video.genre} • {video.releaseYear}
          </p>
          <p className={styles.description}>{video.description}</p>

          <div className={styles.btnGroup}>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={() => {
                setShowEditModal(true);
              }}
            >
              Edit
            </button>
            <Button
              variant="danger"
              onClick={async () => {
                const confirmed = window.confirm('Are you sure you want to delete this show?');
                if (confirmed) {
                  await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Videos/${id}`, { method: 'DELETE' });
                  router.push('/');
                }
              }}
            >
              Delete
            </Button>
          </div>

          {video.tmdbRating && (
            <div className={styles.ratingOverlay}>
              <div className={styles.ratingWrapper}>
                <svg className={styles.ratingCircle} viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className={styles.circleBg}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />

                  {/* Progress circle */}
                  <path
                    className={styles.circleProgress}
                    strokeDasharray={`${Math.round((video.tmdbRating ?? 0) * 10)}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />

                  {/* Center background */}
                  <circle cx="18" cy="18" r="14.5" className={styles.innerCircle} />

                  {/* Rating text */}
                  <text x="18" y="18.5" className={styles.ratingText}>
                    {video.tmdbRating ? `${Math.round(video.tmdbRating * 10)}%` : 'N/A'}
                  </text>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Right: Streaming Platforms */}
        <div className="flex-1">
          <h2 className={styles.sectionTitle}>
            Where to Watch
            <button type="button" className={`${styles.buttonPrimary2} mt-2`} onClick={() => setShowUrlModal(true)}>
              Add Platform
            </button>
          </h2>
          {videoUrls.map((vu) => (
            <div key={vu.id} className={styles.urlCard}>
              <a href={vu.url} target="_blank" rel="noopener noreferrer">
                {vu.platform?.name || 'Unknown'}
              </a>
              <div className={styles.btnGroup}>
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  onClick={() => {
                    setEditUrlData({
                      id: vu.id,
                      url: vu.url,
                      platformId: vu.platformId.toString(),
                    });
                    setEditUrlModal(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.buttonDanger}
                  onClick={async () => {
                    await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/VideoUrls/${vu.id}`, { method: 'DELETE' });
                    setVideoUrls(videoUrls.filter((v) => v.id !== vu.id));
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {videoUrls.length === 0 && <p className="text-sm text-[#999] mb-2">No platforms added yet.</p>}
        </div>

        {/* EPISODES */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
              <h2 className="text-xl font-semibold mb-2 sm:mb-0">Episodes</h2>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <select value={episodeFilter} onChange={(e) => setEpisodeFilter(e.target.value)} className={styles.selectCustom}>
                  <option value="">All</option>
                  <option value="Watched">Watched</option>
                  <option value="Watching">Watching</option>
                  <option value="Not Watched">Not Watched</option>
                </select>
                <Button variant="warning" onClick={() => setShowEpisodeModal(true)} className={styles.buttonPrimary3}>
                  Add Episode
                </Button>
              </div>
            </div>
          </div>

          {episodes.map((ep) => {
            let statusClass = 'statusNotWatched';
            if (ep.status === 'Watched') statusClass = 'statusWatched';
            else if (ep.status === 'Watching') statusClass = 'statusWatching';

            return (
              <div key={ep.id} className={styles.episodeCardNew}>
                <span className={`${styles.episodeStatus} ${styles[statusClass]}`}>{ep.status}</span>

                <h3 className={styles.episodeTitle}>{ep.name}</h3>
                <p className={styles.episodeInfo}>
                  Season {ep.season ?? 'N/A'} • Episode {ep.episodeNumber ?? 'N/A'}
                </p>
                <p className={styles.episodeInfo}>Stopped at: {ep.timeStopped || '00:00:00'}</p>

                {ep.tmdbRating && (
                  <div className={styles.ratingWrapper}>
                    <svg className={styles.ratingCircle} viewBox="0 0 36 36">
                      {/* Background circle */}
                      <path
                        className={styles.circleBg}
                        d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                      />

                      {/* Progress circle */}
                      <path
                        className={styles.circleProgress}
                        strokeDasharray={`${Math.round((ep.tmdbRating ?? 0) * 10)}, 100`}
                        d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                      />

                      {/* Center background */}
                      <circle cx="18" cy="18" r="14.5" className={styles.innerCircle} />

                      {/* Rating text */}
                      <text x="18" y="18.5" className={styles.ratingText}>
                        {ep.tmdbRating ? `${Math.round(ep.tmdbRating * 10)}%` : 'N/A'}
                      </text>
                    </svg>
                  </div>
                )}

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    className={styles.buttonPrimary}
                    onClick={() => {
                      setEditEpisodeData({ ...ep });
                      setShowEditEpisodeModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteEpisode(ep.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
          {episodes.length === 0 && <p className="text-[#999] text-sm mt-2">No episodes found.</p>}
        </section>
      </div>
      <Modal show={showUrlModal} onHide={() => setShowUrlModal(false)} centered dialogClassName={styles.customModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add Platform</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formPlatformSelect">
              <Form.Label>Platform</Form.Label>
              <Form.Select value={newUrlData.platformId || ''} onChange={(e) => setNewUrlData({ ...newUrlData, platformId: e.target.value })}>
                <option value="">Select a platform</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formPlatformUrl">
              <Form.Label>Platform URL</Form.Label>
              <Form.Control type="text" value={newUrlData.url || ''} onChange={(e) => setNewUrlData({ ...newUrlData, url: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUrlModal(false)}>
            Cancel
          </Button>
          <Button
            className={styles.buttonPrimary}
            onClick={async () => {
              await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/VideoUrls`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...newUrlData,
                  videoId: id,
                  userId: video.userId,
                }),
              });
              const res = await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/VideoUrls/video/${id}`);
              const data = await res.json();
              setVideoUrls(data.$values || []);
              setShowUrlModal(false);
              setNewUrlData({});
            }}
          >
            Add
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={editUrlModal} onHide={() => setEditUrlModal(false)} centered dialogClassName={styles.customModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Platform</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formEditPlatformSelect">
              <Form.Label>Platform</Form.Label>
              <Form.Select value={editUrlData.platformId || ''} onChange={(e) => setEditUrlData({ ...editUrlData, platformId: e.target.value })}>
                <option value="">Select a platform</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEditPlatformUrl">
              <Form.Label>Platform URL</Form.Label>
              <Form.Control type="text" value={editUrlData.url || ''} onChange={(e) => setEditUrlData({ ...editUrlData, url: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditUrlModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className={styles.buttonPrimary}
            onClick={async () => {
              await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/VideoUrls/${editUrlData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...editUrlData,
                  videoId: parseInt(id, 10), // ✅ include videoId
                  userId: video.userId, // ✅ just in case your BE requires it
                }),
              });

              const res = await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/VideoUrls/video/${id}`);
              const data = await res.json();
              setVideoUrls(data.$values || []);
              setEditUrlModal(false);
              setEditUrlData({});
            }}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEpisodeModal} onHide={() => setShowEpisodeModal(false)} centered dialogClassName={styles.customModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add Episode</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Episode Name</Form.Label>
              <Form.Control type="text" value={newEpisode.name || ''} onChange={(e) => setNewEpisode({ ...newEpisode, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Season</Form.Label>
              <Form.Control type="number" value={newEpisode.season || ''} onChange={(e) => setNewEpisode({ ...newEpisode, season: parseInt(e.target.value, 10) })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Episode Number</Form.Label>
              <Form.Control type="number" value={newEpisode.episodeNumber || ''} onChange={(e) => setNewEpisode({ ...newEpisode, episodeNumber: parseInt(e.target.value, 10) })} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEpisodeStatus">
              <Form.Label>Status</Form.Label>
              <Form.Select value={newEpisode.status || ''} onChange={(e) => setNewEpisode({ ...newEpisode, status: e.target.value })}>
                <option value="">Select Status</option>
                <option value="Watched">Watched</option>
                <option value="Not Watched">Not Watched</option>
                <option value="Watching">Watching</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEpisodeModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className={styles.buttonPrimary}
            onClick={async () => {
              await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Episodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...newEpisode,
                  videoId: id,
                  userId: video.userId,
                  status: newEpisode.status || 'Not Watched',
                  timeStopped: '00:00:00',
                }),
              });
              const res = await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Episodes/video/${id}`);
              const data = await res.json();
              setEpisodes(
                (data.$values || []).sort((a, b) => {
                  if (a.season === 0 && b.season !== 0) return 1;
                  if (b.season === 0 && a.season !== 0) return -1;
                  const seasonCompare = (a.season ?? 0) - (b.season ?? 0);
                  if (seasonCompare !== 0) return seasonCompare;
                  return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
                }),
              );
              setNewEpisode({});
              setShowEpisodeModal(false);
            }}
          >
            Add Episode
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditEpisodeModal} onHide={() => setShowEditEpisodeModal(false)} centered dialogClassName={styles.customModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Episode</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Episode Name</Form.Label>
              <Form.Control type="text" value={editEpisodeData.name || ''} onChange={(e) => setEditEpisodeData({ ...editEpisodeData, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Season</Form.Label>
              <Form.Control type="number" value={editEpisodeData.season || ''} onChange={(e) => setEditEpisodeData({ ...editEpisodeData, season: parseInt(e.target.value, 10) })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Episode Number</Form.Label>
              <Form.Control type="number" value={editEpisodeData.episodeNumber || ''} onChange={(e) => setEditEpisodeData({ ...editEpisodeData, episodeNumber: parseInt(e.target.value, 10) })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                <option value="">Select Status</option>
                <option value="Watched">Watched</option>
                <option value="Not Watched">Not Watched</option>
                <option value="Watching">Watching</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditEpisodeModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className={styles.buttonPrimary}
            onClick={async () => {
              await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Episodes/${editEpisodeData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editEpisodeData),
              });
              const res = await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Episodes/video/${id}`);
              const data = await res.json();
              setEpisodes(
                (data.$values || []).sort((a, b) => {
                  if (a.season === 0 && b.season !== 0) return 1;
                  if (b.season === 0 && a.season !== 0) return -1;
                  const seasonCompare = (a.season ?? 0) - (b.season ?? 0);
                  if (seasonCompare !== 0) return seasonCompare;
                  return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
                }),
              );
              setShowEditEpisodeModal(false);
            }}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered dialogClassName={styles.customModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Show</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control type="text" value={editData.title || ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formGenre">
              <Form.Label>Genre</Form.Label>
              <Form.Control type="text" value={editData.genre || ''} onChange={(e) => setEditData({ ...editData, genre: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formYear">
              <Form.Label>Release Year</Form.Label>
              <Form.Control type="number" value={editData.releaseYear || ''} onChange={(e) => setEditData({ ...editData, releaseYear: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>Personal Rating</Form.Label>
              <Form.Control as="textarea" rows={1} value={editData.rating || ''} onChange={(e) => setEditData({ ...editData, rating: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>Status</Form.Label>
              <Form.Select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                <option value="">Select Status</option>
                <option value="Watched">Watched</option>
                <option value="Not Watched">Not Watched</option>
                <option value="Watching">Watching</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className={styles.buttonPrimary}
            onClick={async () => {
              await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Videos/${id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(editData),
              });
              setVideo(editData);
              setShowEditModal(false);
            }}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
