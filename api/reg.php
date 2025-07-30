<?php
// test_register.php

// Configuration
$apiUrl = 'http://localhost/shop_mgmt/auth.php.php?action=register';
$testData = [
    'username' => 'testuser_' . uniqid(), // Unique username for each test
    'email' => 'test_' . uniqid() . '@example.com',
    'password' => 'TestPassword123!',
    'confirmPassword' => 'TestPassword123!' // Only needed if your API requires it
];

// Create cURL request
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

// Execute and get response
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Display results
echo "<h1>User Registration API Test</h1>";
echo "<h2>Test Data:</h2>";
echo "<pre>" . print_r($testData, true) . "</pre>";

echo "<h2>Response (HTTP {$httpCode}):</h2>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

// Decode JSON response
$jsonResponse = json_decode($response, true);

echo "<h2>Interpretation:</h2>";
if ($httpCode === 201) {
    echo "<p style='color:green;'>✅ Registration successful!</p>";
    echo "<p>Message: " . htmlspecialchars($jsonResponse['message'] ?? '') . "</p>";
} else {
    echo "<p style='color:red;'>❌ Registration failed</p>";
    echo "<p>Error: " . htmlspecialchars($jsonResponse['message'] ?? 'Unknown error') . "</p>";
}