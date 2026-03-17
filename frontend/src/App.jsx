import './index.css';

function App() {
  return (
    <div style={styles.page}>
      <div style={styles.glowTop}></div>
      <div style={styles.glowBottom}></div>

      <nav style={styles.nav}>
        <div style={styles.logo}>Dateify</div>
        <div style={styles.navLinks}>
          <a href="#">Plan</a>
          <a href="#">Route</a>
        </div>
      </nav>

      <main style={styles.main}>
        <section style={styles.hero}>
          <p style={styles.badge}>AI-Powered Date Planning</p>
          <h1 style={styles.title}>
            Your perfect date,
            <br />
            planned for you.
          </h1>
          <p style={styles.subtitle}>
            Tell us your vibe, time, and location. We’ll generate the plan,
            route, and activities so you can just enjoy the moment.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Plan your date</h2>

          <div style={styles.form}>
            <input style={styles.input} placeholder="Starting location" />
            <input style={styles.input} placeholder="Preferred area" />
            <select style={styles.input}>
              <option>Date duration</option>
              <option>2 hours</option>
              <option>4 hours</option>
              <option>Whole evening</option>
            </select>
            <select style={styles.input}>
              <option>Choose a vibe</option>
              <option>Romantic</option>
              <option>Chill</option>
              <option>Foodie</option>
              <option>Adventurous</option>
            </select>
            <button style={styles.primaryButton}>Generate Plan</button>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0b0d0f',
    color: '#f5f7fa',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  glowTop: {
    position: 'absolute',
    top: '-120px',
    left: '-120px',
    width: '320px',
    height: '320px',
    background: 'rgba(30, 215, 96, 0.18)',
    filter: 'blur(120px)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  glowBottom: {
    position: 'absolute',
    bottom: '-120px',
    right: '-120px',
    width: '320px',
    height: '320px',
    background: 'rgba(255, 79, 163, 0.16)',
    filter: 'blur(120px)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  nav: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0 24px',
    position: 'relative',
    zIndex: 1,
  },
  logo: {
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
    color: '#a7b0ba',
    fontSize: '15px',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '32px',
    alignItems: 'center',
    minHeight: 'calc(100vh - 100px)',
    position: 'relative',
    zIndex: 1,
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  badge: {
    display: 'inline-block',
    width: 'fit-content',
    padding: '8px 14px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#a7b0ba',
    fontSize: '14px',
  },
  title: {
    fontSize: '64px',
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: '-0.04em',
  },
  subtitle: {
    fontSize: '18px',
    lineHeight: 1.6,
    color: '#a7b0ba',
    maxWidth: '620px',
  },
  card: {
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderRadius: '28px',
    padding: '28px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '20px',
  },
  form: {
    display: 'grid',
    gap: '16px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#f5f7fa',
    fontSize: '15px',
    outline: 'none',
  },
  primaryButton: {
    marginTop: '8px',
    padding: '14px 18px',
    border: 'none',
    borderRadius: '18px',
    background: '#1ED760',
    color: '#08110b',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 0 30px rgba(30, 215, 96, 0.25)',
  },
};

export default App;