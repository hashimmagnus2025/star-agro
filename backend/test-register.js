const testRegistration = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'User',
        email: `test${Date.now()}@example.com`,
        phone: '9999999999',
        password: 'test123'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testRegistration();
