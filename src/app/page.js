'use client';

/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/utils/context/authContext';
import { Modal, Button, Form } from 'react-bootstrap';
import Link from 'next/link';
import styles from '../styles/HomePage.module.css';

export default function HomePage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [shows, setShows] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    genre: '',
    releaseYear: '',
    status: '',
    rating: '',
  });

  const fetchAllData = async () => {
    try {
      const userRes = await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/users/uid/${user.uid}`);
      const userData = await userRes.json();

      const [videoRes, platformRes] = await Promise.all([fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/Videos/user/${userData.id}`), fetch('https://streamtracker-be-9d38b309655b.herokuapp.com/api/Platforms')]);

      if (!videoRes.ok || !platformRes.ok) throw new Error('Failed to fetch data');

      const videoData = await videoRes.json();
      const platformData = await platformRes.json();

      setShows(Array.isArray(videoData?.$values) ? videoData.$values : []);
      setPlatforms(Array.isArray(platformData?.$values) ? platformData.$values : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    fetchAllData();

    const refreshListener = () => fetchAllData();
    window.addEventListener('refresh-shows', refreshListener);
    // eslint-disable-next-line consistent-return
    return () => window.removeEventListener('refresh-shows', refreshListener);
  }, [user?.uid]);

  const filteredShows = shows.filter((show) => (!statusFilter || show.status === statusFilter) && (!platformFilter || show.videoUrls?.$values?.some((vu) => vu.platform?.name === platformFilter)));

  const handleCreateVideo = async () => {
    if (!user?.uid) return;

    try {
      const userRes = await fetch(`https://streamtracker-be-9d38b309655b.herokuapp.com/api/users/uid/${user.uid}`);
      const userData = await userRes.json();

      const payload = {
        userId: userData.id,
        title: newVideo.title,
        description: newVideo.description,
        genre: newVideo.genre,
        releaseYear: parseInt(newVideo.releaseYear, 10),
        status: newVideo.status,
        rating: parseInt(newVideo.rating, 10),
      };

      const res = await fetch('https://streamtracker-be-9d38b309655b.herokuapp.com/api/Videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create video');
      const created = await res.json();

      setShows((prev) => [...prev, created]);
      setNewVideo({ title: '', description: '', genre: '', releaseYear: '', status: '', rating: '' });
      setShowModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className={styles.mainContainer}>
      <h1 className={styles.header}>Your Shows and Movies</h1>

      <Button className={styles.addButton} onClick={() => setShowModal(true)}>
        Add Video
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="true" dialogClassName={styles.customModal} keyboard>
        <Modal.Header closeButton>
          <Modal.Title>Add a New Show</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {['title', 'description', 'genre', 'releaseYear', 'rating'].map((field) => (
            <Form.Group key={field} className="mb-2">
              <Form.Control type={field === 'releaseYear' || field === 'rating' ? 'number' : 'text'} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={newVideo[field]} onChange={(e) => setNewVideo({ ...newVideo, [field]: e.target.value })} />
            </Form.Group>
          ))}
          <Form.Group className="mb-2">
            <Form.Select value={newVideo.status} onChange={(e) => setNewVideo({ ...newVideo, status: e.target.value })}>
              <option value="">Select Status</option>
              <option value="Watched">Watched</option>
              <option value="Not Watched">Not Watched</option>
              <option value="Watching">Watching</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleCreateVideo}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <div className={styles.cardGrid}>
        {filteredShows.map((show) => (
          <Link key={show.id} href={`/viewVideo/${show.id}`} passHref legacyBehavior>
            <a className={styles.card} href={`/viewVideo/${show.id}`}>
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
                    strokeDasharray={`${Math.round((show.tmdbRating ?? 0) * 10)}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />

                  {/* Center background */}
                  <circle cx="18" cy="18" r="14.5" className={styles.innerCircle} />

                  {/* Rating text */}
                  <text x="18" y="18.5" className={styles.ratingText}>
                    {show.tmdbRating ? `${Math.round(show.tmdbRating * 10)}%` : 'N/A'}
                  </text>
                </svg>
              </div>
              {(() => {
                let statusClass = styles.statusNotWatched;
                if (show.status === 'Watched') {
                  statusClass = styles.statusWatched;
                } else if (show.status === 'Watching') {
                  statusClass = styles.statusWatching;
                }
                return <div className={`${styles.statusBadge} ${statusClass}`}>{show.status}</div>;
              })()}
              <h2 className={styles.cardTitle}>{show.title}</h2>
              <p className={styles.cardSubtitle}>
                {show.genre} • {show.releaseYear}
              </p>
              <p className={styles.cardDesc}>{show.description}</p>
              <p className={styles.cardSectionTitle}>Where to Watch</p>
              <p className={styles.platformList}>
                {Array.isArray(show.videoUrls?.$values)
                  ? show.videoUrls.$values
                      .map((vu) => vu.platform?.name)
                      .filter(Boolean)
                      .join(', ')
                  : 'None'}
              </p>
            </a>
          </Link>
        ))}
        {filteredShows.length === 0 && <p style={{ color: '#333', marginTop: '2rem' }}>You have nothing to watch yet!</p>}
      </div>
    </main>
  );
}
