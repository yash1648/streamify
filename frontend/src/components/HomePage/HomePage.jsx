import CreateRoomForm from './CreateRoomForm';
import JoinRoomForm from './JoinRoomForm';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="home-title">Streamify</h1>
        <p className="home-subtitle">Watch together, wherever you are.</p>
      </header>

      <div className="forms-container">
        <CreateRoomForm />
        <div className="form-divider"></div>
        <JoinRoomForm />
      </div>
    </div>
  );
};

export default HomePage;
