'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/utils/context/authContext';
import { Modal, Button, Form } from 'react-bootstrap';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';

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

  useEffect(() => {
    if (!user?.uid) return;

    const fetchData = async () => {
      try {
        const userRes = await fetch(`http://localhost:5193/api/Users/uid/${user.uid}`);
        if (!userRes.ok) throw new Error('Failed to fetch user');
        const userData = await userRes.json();

        const [videoRes, platformRes] = await Promise.all([fetch(`http://localhost:5193/api/Videos/user/${userData.id}`), fetch('http://localhost:5193/api/Platforms')]);

        if (!videoRes.ok || !platformRes.ok) throw new Error('Failed to fetch data');

        const videoData = await videoRes.json();
        const platformData = await platformRes.json();

        setShows(Array.isArray(videoData?.$values) ? videoData.$values : []);
        setPlatforms(Array.isArray(platformData?.$values) ? platformData.$values : []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 5000); // refresh every 5s

    // eslint-disable-next-line consistent-return
    return () => clearInterval(interval);
  }, [user?.uid]);

  useEffect(() => {
    const handler = () => {
      // re-fetch shows when RatGPT adds a show
      if (user?.uid) {
        const fetchShows = async () => {
          const res = await fetch(`http://localhost:5193/api/Videos/user/${user.uid}`);
          const data = await res.json();
          setShows(data?.$values || []);
        };
        fetchShows();
      }
    };

    window.addEventListener('refresh-shows', handler);
    return () => window.removeEventListener('refresh-shows', handler);
  }, [user?.uid]);

  const filteredShows = Array.isArray(shows) ? shows.filter((show) => (statusFilter ? show.status === statusFilter : true) && (platformFilter ? show.videoUrls?.$values?.some((vu) => vu.platform?.name === platformFilter) : true)) : [];

  const handleCreateVideo = async () => {
    if (!user?.uid) return;

    try {
      const userRes = await fetch(`http://localhost:5193/api/Users/uid/${user.uid}`);
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

      const res = await fetch('http://localhost:5193/api/Videos', {
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
    <main className={`flex flex-col items-center justify-start p-4 min-h-screen bg-black ${showModal ? 'modal-blur' : ''}`}>
      <div className="w-full max-w-2xl">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Your Shows and Movies</h1>
        </header>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select className="p-2 border rounded w-full sm:w-1/2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Your Videos</option>
            <option value="Watched">Watched</option>
            <option value="Not Watched">Not Watched</option>
            <option value="Watching">Watching</option>
          </select>

          <select className="p-2 border rounded w-full sm:w-1/2" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
            <option value="">Sort By Platform</option>
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.name}>
                {platform.name}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="mb-4 p-2 w-full bg-blue-600 text-black rounded hover:bg-blue-700" onClick={() => setShowModal(true)}>
          Add Show
        </button>

        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
          backdrop="true"
          // eslint-disable-next-line react/jsx-boolean-value
          keyboard={true}
        >
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

        <div className="space-y-4">
          {filteredShows.map((show) => (
            <Link key={show.id} href={`/viewVideo/${show.id}`} passHref legacyBehavior>
              <a className="block" href={`/viewVideo/${show.id}`}>
                <div className="p-4 bg-white shadow rounded hover:bg-gray-100">
                  <h2 className="text-xl font-semibold text-black">{show.title}</h2>
                  <p className="text-sm text-black">{show.genre}</p>
                  <p className="text-sm mt-1 text-black">
                    <strong>Status:</strong> {show.status}
                  </p>
                  <p className="text-sm mt-1 text-black">
                    <strong>Platforms:</strong>{' '}
                    {Array.isArray(show.videoUrls?.$values)
                      ? show.videoUrls.$values
                          .map((vu) => vu.platform?.name)
                          .filter(Boolean)
                          .join(', ')
                      : 'None'}
                  </p>
                </div>
              </a>
            </Link>
          ))}
          {filteredShows.length === 0 && <p className="text-center text-gray-400">You have nothing to watch yet!</p>}
        </div>
      </div>
    </main>
  );
}
