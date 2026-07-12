import Login from './Login';
import styles from './header.module.css';

export default function Header() {
  return (
    <header>
      <nav></nav>

      <div className={styles.loginWrapper}>
        <Login />
      </div>
    </header>
  );
}
