import React from 'react';
import Link from 'next/link';
import { Navbar, Container, Button } from 'react-bootstrap';
import { signOut } from '../utils/auth';
import styles from '../styles/NavBar.module.css';

export default function NavBar() {
  return (
    <Navbar expand="lg" className={styles.navbar}>
      <Container>
        <Link passHref href="/" className={`navbar-brand ${styles.navbarBrand}`}>
          StreamTracker
        </Link>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <div className="ms-auto">
            <Button className={styles.signOutButton} onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
