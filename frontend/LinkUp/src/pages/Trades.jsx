import { useState, useEffect } from 'react'

function Trades() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        console.log("Attempting to fetch from backend...");
        const response = await fetch('http://localhost:5000/api/tests');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to fetch tests');
        }
        const data = await response.json();
        console.log("Received data:", data);
        setTests(data);
      } catch (error) {
        console.error("Error fetching tests:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Tests</h2>
        <p>{error}</p>
        <p>Please make sure the backend server is running at http://localhost:5000</p>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Tests Collection Data</h1>
      <div className="tests-container">
        {tests.length === 0 ? (
          <p>No tests found in the collection.</p>
        ) : (
          tests.map((test) => (
            <div key={test.id} className="test-card">
              <h2>{test.Name || 'No Title'}</h2>
              <p>{test.Profession || 'No Description'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Trades
