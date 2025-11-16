"use client";
import React, { useState } from 'react';

export default function PasskeyInput() {
  const [passkey, setPasskey] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page reload
    // Your submission logic here (e.g., validate or send to API)
    console.log('Submitted passkey:', passkey);
    // Example: If it's a valid passkey, do something like redirect or show success
    if (passkey === 'correctpasskey') {
      alert('Passkey accepted!');
    } else {
      alert('Invalid passkey');
    }
    setPasskey(''); // Clear input after submit
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-80">
        <label htmlFor="passkey" className="block text-sm font-medium text-gray-700 mb-2">
          Enter Passkey
        </label>
        <input
          type="text"
          id="passkey"
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your passkey and press Enter"
          required
        />
        <button
          type="submit"
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
        >
          Submit
        </button>

      </form>
    </div>
  );
}
