export default function UserProfile({ user }) {
  const defaultUser = {
    name: "Tarun Naveen",
    email: "tarun@example.com"
  };
  
  const displayUser = user || defaultUser;

  return (
    <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div className="avatar" style={{ 
        width: '34px', height: '34px', borderRadius: '50%', 
        background: 'var(--accent)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 'bold', fontSize: '0.9rem',
        boxShadow: '0 0 10px rgba(255, 75, 75, 0.3)'
      }}>
        {displayUser.name.charAt(0)}
      </div>

      <div className="user-info" style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="user-name" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{displayUser.name}</span>
        <span className="user-email" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{displayUser.email}</span>
      </div>
    </div>
  );
}
