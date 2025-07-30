// Demo user setup script
// This should be run in the browser console to create a demo user

const users = {
  'demo': {
    password: 'demo',
    user: {
      id: 'user_demo_123456789',
      username: 'demo',
      name: 'Demo User',
      createdAt: new Date().toISOString()
    }
  }
};

localStorage.setItem('health_app_users', JSON.stringify(users));
console.log('Demo user created! Username: demo, Password: demo');
