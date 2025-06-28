<?php
// It's better to manage errors programmatically than display them to users.
ini_set('display_errors', 0);
error_reporting(E_ALL);

require 'vendor/autoload.php';

// --- Header Configuration ---
// NOTE: For a live application, you should change '*' to your specific frontend URL (e.g., "https://your-app.com")
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// --- JWT & Database Configuration (Hardcoded as requested) ---
$secretKey = 'faec25dba0f91960ba96309f39622702b6a9b5a96eedba789974029c5f3c2eaa3e988a9216e79236e3cf2b5ffc10b831276c4cbc35a88c4a38a9d70aad77343a';
$algorithm = 'HS256';

$dbHost = 'localhost';
$dbName = 'nyvjzrsb_shopmgmt';
$dbUser = 'nyvjzrsb_shopmgmt';
$dbPass = '69rLztX2x4R6bmPAUbxY';

// --- Generic Error Handler ---
function send_error($statusCode, $message, $logMessage = '') {
    http_response_code($statusCode);
    if ($logMessage) {
        error_log($logMessage);
    }
    echo json_encode(['message' => $message]);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    send_error(500, 'Could not connect to the database.', 'Database connection failed: ' . $e->getMessage());
}

// --- Helper Functions ---
function recordActivity($pdo, $userId, $activityType, $description, $organizationId = null) {
    try {
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
       $sql = "INSERT INTO user_activity (user_id, organization_id, activity_type, description, ip_address, created_at) 
        VALUES (:user_id, :organization_id, :activity_type, :description, :ip_address, NOW())";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':user_id'         => $userId,
            ':organization_id' => $organizationId,
            ':activity_type'   => $activityType,
            ':description'     => $description,
            ':ip_address'      => $ipAddress
        ]);
    } catch (PDOException $e) {
        error_log("Failed to record user activity: " . $e->getMessage());
    }
}

function recordLoginAttempt($pdo, $username, $success, $organizationId = null) {
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    try {
        $stmt = $pdo->prepare("INSERT INTO login_attempts 
            (username, success, ip_address, organization_id) 
            VALUES (:username, :success, :ip_address, :organization_id)");
        
        $stmt->execute([
            ':username' => $username,
            ':success' => $success,
            ':ip_address' => $ipAddress,
            ':organization_id' => $organizationId
        ]);
    } catch (PDOException $e) {
        error_log("Login attempt error: " . $e->getMessage());
    }
}


// --- Main API Logic ---
$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';
$loggedInUser = null; 

// --- Authentication & Authorization for Protected Routes ---
$protectedRoutes = ['get_report_data','get_products', 'create_product', 'update_product', 'delete_product','dashboard_stats','get_sales_data','get_product_performance','get_commission_report','get_users', 'update_user', 'reset_password', 'get_activity_logs'];

   if (in_array($action, $protectedRoutes)) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (!$authHeader) {
        send_error(401, 'Authentication token not provided.');
    }
    
    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        send_error(401, 'Invalid authentication token format.');
    }
    
    $token = $matches[1];
    
    try {
        $decoded = JWT::decode($token, new Key($secretKey, $algorithm));
        
        // Additional validation
        $currentTime = time();
        if ($decoded->exp < $currentTime) {
            send_error(401, 'Token has expired.');
        }
        
        $stmt = $pdo->prepare("SELECT id, username, role, is_active, organization_id FROM users WHERE id = :id");
        $stmt->execute([':id' => $decoded->sub]);
        $user = $stmt->fetch();

        if (!$user) {
            send_error(403, 'User not found.');
        }

        if (!$user['is_active']) {
            send_error(403, 'Your account is deactivated.');
        }

        if ($user['role'] !== 'admin') {
            send_error(403, 'Insufficient privileges.');
        }
        
        $loggedInUser = $user; 
        
    } catch (Exception $e) {
        error_log('JWT Error: ' . $e->getMessage());
        send_error(401, 'Authentication failed. Please log in again.');
    }
}


try {
    switch ($action) {
        case 'login':
            if (empty($input['username']) || empty($input['password'])) {
                send_error(400, 'Username and password are required.');
            }
        
            $username = trim($input['username']);
            $password = $input['password'];
        
            $stmt = $pdo->prepare("SELECT id, username, password, role, is_active, organization_id FROM users WHERE username = :username");
            $stmt->execute([':username' => $username]);
            $user = $stmt->fetch();
        
            if (!$user) {
                recordLoginAttempt($pdo, $username, 0);
                send_error(401, 'Invalid username or password.');
            }
        
            if (!password_verify($password, $user['password'])) {
                recordLoginAttempt($pdo, $username, 0);
                send_error(401, 'Invalid username or password.');
            }
        
            if (!$user['is_active']) {
                recordLoginAttempt($pdo, $username, 0, $user['organization_id']);
                send_error(403, 'Your account is deactivated.');
            }
        
            if ($user['role'] !== 'admin') {
                recordLoginAttempt($pdo, $username, 0, $user['organization_id']);
                send_error(403, 'Access Denied: This system is for administrators only.');
            }
        
            $payload = [
                'sub' => $user['id'], 
                'username' => $user['username'], 
                'role' => $user['role'],
                'organization_id' => $user['organization_id'], 
                'iat' => time(), 
                'exp' => time() + (60 * 60 * 24) // 1 day expiration
            ];
            
            $token = JWT::encode($payload, $secretKey, $algorithm);
        
            recordLoginAttempt($pdo, $username, 1, $user['organization_id']);
            recordActivity($pdo, $user['id'], 'login', 'User ' . $user['username'] . ' logged in successfully.', $user['organization_id']);
        
            http_response_code(200);
            echo json_encode([
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'], 
                    'username' => $user['username'], 
                    'role' => $user['role'],
                    'organization_id' => $user['organization_id']
                ],
                'token' => $token
            ]);
            break;

      
            case 'dashboard_stats':
                $orgId = $loggedInUser['organization_id'];
                
                try {
                    // Total products
                    $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE organization_id = ?");
                    $stmt->execute([$orgId]);
                    $totalProducts = $stmt->fetchColumn();
                    
                    // Monthly sales
                    $monthStart = date('Y-m-01');
                    $monthEnd = date('Y-m-t');
                    $stmt = $pdo->prepare("SELECT SUM(Sold_Price) FROM product_transactions 
                                          WHERE organization_id = ? 
                                          AND transaction_date BETWEEN ? AND ?");
                    $stmt->execute([$orgId, $monthStart, $monthEnd]);
                    $monthlySales = $stmt->fetchColumn() ?: 0;
                    
                    // Active users
                    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users 
                                          WHERE organization_id = ? AND is_active = 1");
                    $stmt->execute([$orgId]);
                    $activeUsers = $stmt->fetchColumn();
                    
                    // Low stock items (example threshold: < 10 items)
                   $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE organization_id = ? AND quantity < 10");
                   $stmt = $pdo->prepare("SELECT * FROM user_activity WHERE organization_id = ? ORDER BY created_at DESC LIMIT 5");
                    $stmt->execute([$orgId]);
                    $lowStockItems = $stmt->fetchColumn();
                    
                    // Recent activities
                    $stmt = $pdo->prepare("SELECT * FROM user_activity 
                                          WHERE organization_id = ? 
                                          ORDER BY activity_time DESC LIMIT 5");
                    $stmt->execute([$orgId]);
                    $recentActivities = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode([
                        'totalProducts' => $totalProducts,
                        'monthlySales' => $monthlySales,
                        'activeUsers' => $activeUsers,
                        'lowStockItems' => $lowStockItems,
                        'recentActivities' => $recentActivities
                    ]);
                    
                } catch (PDOException $e) {
                    send_error(500, 'Error fetching dashboard data', $e->getMessage());
                }
                break;
       
               // auths.php updates
// ... existing code ...

case 'create_product':
    $required = ['name', 'import_price', 'selling_price'];
    foreach ($required as $field) {
        if (empty($input[$field])) send_error(400, "Missing $field");
    }
    
    try {
        $pdo->beginTransaction();
        
        // Insert product
        $stmt = $pdo->prepare("INSERT INTO products 
            (name, description, category, import_price, selling_price, organization_id)
            VALUES (:name, :desc, :cat, :imp, :sell, :org)");
        
        $stmt->execute([
            ':name' => $input['name'],
            ':desc' => $input['description'] ?? '',
            ':cat' => $input['category'] ?? '',
            ':imp' => $input['import_price'],
            ':sell' => $input['selling_price'],
            ':org' => $loggedInUser['organization_id']
        ]);
        
        $productId = $pdo->lastInsertId();
        
        // Create inventory record
        $quantity = $input['quantity'] ?? 0;
        if ($quantity > 0) {
            $stmt = $pdo->prepare("INSERT INTO product_inventory 
                (product_id, quantity, status, status_changed_at)
                VALUES (:pid, :qty, 'in_store', NOW())");
            
            $stmt->execute([
                ':pid' => $productId,
                ':qty' => $quantity
            ]);
        }
        
        $pdo->commit();
        echo json_encode(['message' => 'Product created']);
    } catch (Exception $e) {
        $pdo->rollBack();
        send_error(500, 'Error creating product', $e->getMessage());
    }
    break;

case 'update_product':
    $required = ['id', 'name', 'import_price', 'selling_price'];
    foreach ($required as $field) {
        if (empty($input[$field])) send_error(400, "Missing $field");
    }

    try {
        $pdo->beginTransaction();

        // Update product details
        $stmt = $pdo->prepare("UPDATE products 
            SET name = :name,
                description = :desc,
                category = :cat,
                import_price = :imp,
                selling_price = :sell
            WHERE id = :id AND organization_id = :org");
        $stmt->execute([
            ':name' => $input['name'],
            ':desc' => $input['description'] ?? '',
            ':cat' => $input['category'] ?? '',
            ':imp' => $input['import_price'],
            ':sell' => $input['selling_price'],
            ':id' => $input['id'],
            ':org' => $loggedInUser['organization_id']
        ]);

        // Remove all existing in_store inventory records for this product
        $stmt = $pdo->prepare("DELETE FROM product_inventory WHERE product_id = :pid AND status = 'in_store'");
        $stmt->execute([':pid' => $input['id']]);

        // Insert new inventory record with the correct quantity
        $quantity = $input['quantity'] ?? 0;
        if ($quantity > 0) {
            $stmt = $pdo->prepare("INSERT INTO product_inventory 
                (product_id, quantity, status, status_changed_at)
                VALUES (:pid, :qty, 'in_store', NOW())");
            $stmt->execute([
                ':pid' => $input['id'],
                ':qty' => $quantity
            ]);
        }

        $pdo->commit();
        echo json_encode(['message' => 'Product updated']);
    } catch (Exception $e) {
        $pdo->rollBack();
        send_error(500, 'Error updating product', $e->getMessage());
    }
    break;

case 'get_products':
    $stmt = $pdo->prepare("
        SELECT p.*, COALESCE(pi.quantity, 0) AS in_stock
        FROM products p
        LEFT JOIN (
            SELECT product_id, SUM(quantity) AS quantity
            FROM product_inventory
            WHERE status = 'in_store'
            GROUP BY product_id
        ) pi ON p.id = pi.product_id
        WHERE p.organization_id = :org_id
    ");
    $stmt->execute([':org_id' => $loggedInUser['organization_id']]);
    echo json_encode($stmt->fetchAll());
    break;

// ... existing code ...
                
                case 'delete_product':
                    $stmt = $pdo->prepare("DELETE FROM products 
                        WHERE id = :id AND organization_id = :org");
                    $stmt->execute([
                        ':id' => $input['id'],
                        ':org' => $loggedInUser['organization_id']
                    ]);
                    echo json_encode(['message' => 'Product deleted']);
                    break;
                    case 'get_sales_data':
                        $start = $_GET['start'] ?? date('Y-m-01');
                        $end = $_GET['end'] ?? date('Y-m-t');
                        
                        $stmt = $pdo->prepare("
                            SELECT DATE(transaction_date) AS date, 
                                   SUM(Sold_Price) AS total_sales,
                                   COUNT(*) AS transactions
                            FROM product_transactions
                            WHERE organization_id = :org_id
                              AND new_status = 'in_store'
                              AND transaction_date BETWEEN :start AND :end
                            GROUP BY DATE(transaction_date)
                        ");
                        $stmt->execute([
                            ':org_id' => $loggedInUser['organization_id'],
                            ':start' => $start,
                            ':end' => $end
                        ]);
                        echo json_encode($stmt->fetchAll());
                        break;
                    
                    // Product performance endpoint
                    case 'get_product_performance':
                        $stmt = $pdo->prepare("
                            SELECT p.id, p.name, 
                                   SUM(t.quantity) AS total_sold,
                                   SUM(t.Sold_Price) AS total_revenue,
                                   AVG(t.Sold_Price/t.quantity) AS avg_price
                            FROM product_transactions t
                            JOIN products p ON t.product_id = p.id
                            WHERE t.organization_id = :org_id
                              AND t.new_status = 'in_store'
                            GROUP BY p.id
                            ORDER BY total_sold DESC
                        ");
                        $stmt->execute([':org_id' => $loggedInUser['organization_id']]);
                        echo json_encode($stmt->fetchAll());
                        break;
                    
                    // Commission report endpoint
                    case 'get_commission_report':
                        $stmt = $pdo->prepare("
                            SELECT u.username AS worker, 
                                   SUM(t.Sold_Price) AS total_sales,
                                   SUM(pc.amount) AS commissions_paid
                            FROM product_transactions t
                            JOIN paid_commissions pc ON t.user_id = pc.worker_id
                            JOIN users u ON pc.worker_id = u.id
                            WHERE t.organization_id = :org_id
                            GROUP BY pc.worker_id
                        ");
                        $stmt->execute([':org_id' => $loggedInUser['organization_id']]);
                        echo json_encode($stmt->fetchAll());
                        break;
                        case 'get_users':
                            $stmt = $pdo->prepare("SELECT id, username, email, role, is_active, created_at 
                                                  FROM users WHERE organization_id = :org_id");
                            $stmt->execute([':org_id' => $loggedInUser['organization_id']]);
                            echo json_encode($stmt->fetchAll());
                            break;
                        
                        // Update user endpoint
                        case 'update_user':
                            $required = ['id', 'role', 'is_active'];
                            foreach ($required as $field) {
                                if (!isset($input[$field])) send_error(400, "Missing $field");
                            }
                            
                            $stmt = $pdo->prepare("UPDATE users 
                                                  SET role = :role, is_active = :active 
                                                  WHERE id = :id AND organization_id = :org");
                            $stmt->execute([
                                ':role' => $input['role'],
                                ':active' => (int)$input['is_active'],
                                ':id' => $input['id'],
                                ':org' => $loggedInUser['organization_id']
                            ]);
                            echo json_encode(['message' => 'User updated']);
                            break;
                        
                        // Password reset endpoint
                        case 'reset_password':
                            if (empty($input['user_id'])) send_error(400, "User ID required");
                            
                            $newPassword = bin2hex(random_bytes(8)); // Generate temp password
                            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                            
                            $stmt = $pdo->prepare("UPDATE users 
                                                  SET password = :pass 
                                                  WHERE id = :id AND organization_id = :org");
                            $stmt->execute([
                                ':pass' => $hashedPassword,
                                ':id' => $input['user_id'],
                                ':org' => $loggedInUser['organization_id']
                            ]);
                            
                            echo json_encode([
                                'message' => 'Password reset',
                                'temp_password' => $newPassword // Return temp password to admin
                            ]);
                            break;
                        
                        // Activity logs endpoint
                        case 'get_activity_logs':
                            $limit = min($_GET['limit'] ?? 50, 100);
                            $offset = $_GET['offset'] ?? 0;
                            
                            $stmt = $pdo->prepare("SELECT * FROM user_activity 
                                                  WHERE organization_id = :org_id 
                                                  ORDER BY activity_time DESC 
                                                  LIMIT :limit OFFSET :offset");
                            $stmt->bindValue(':org_id', $loggedInUser['organization_id'], PDO::PARAM_INT);
                            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
                            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
                            $stmt->execute();
                            echo json_encode($stmt->fetchAll());
                            break;

case 'get_report_data':
  $start = $_GET['start'] ?? date('Y-m-01');
  $end   = $_GET['end']   ?? date('Y-m-t');
  
  try {
    // Fetch transactions where status changed to 'in_store'
    $stmt = $pdo->prepare("
      SELECT 
        t.id,
        t.product_id,
        t.quantity,
        t.Sold_Price,
        t.transaction_date,
        p.name        AS product_name,
        p.import_price,
        p.category
      FROM product_transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.organization_id = :org_id
        AND t.new_status = 'in_store'
        AND DATE(t.transaction_date) BETWEEN :start AND :end
    ");
    $stmt->execute([
      ':org_id' => $loggedInUser['organization_id'],
      ':start'  => $start,
      ':end'    => $end
    ]);
    $transactions = $stmt->fetchAll();
    
    // Fetch spendings
    $stmt = $pdo->prepare("
      SELECT 
        amount,
        category,
        reason,
        transaction_date 
      FROM spendings 
      WHERE organization_id = :org_id
        AND DATE(transaction_date) BETWEEN :start AND :end
    ");
    $stmt->execute([
      ':org_id' => $loggedInUser['organization_id'],
      ':start'  => $start,
      ':end'    => $end
    ]);
    $spendings = $stmt->fetchAll();
    
    // Calculate overall metrics
    $totalSales    = 0;
    $totalCost     = 0;
    foreach ($transactions as $t) {
      $totalSales += $t['Sold_Price'] * $t['quantity'];
      $totalCost  += $t['import_price'] * $t['quantity'];
    }
    $totalProfit   = $totalSales - $totalCost;
    
    $totalSpending = 0;
    foreach ($spendings as $s) {
      $totalSpending += $s['amount'];
    }
    $netProfit = $totalProfit - $totalSpending;
    
    // Prepare daily data
    $dailyData = [];
    foreach ($transactions as $t) {
      $date       = date('Y-m-d', strtotime($t['transaction_date']));
      $saleAmount = $t['Sold_Price'];
      
      if (!isset($dailyData[$date])) {
        $dailyData[$date] = [
          'date'   => $date,
          'sales'  => 0,
          'cost'   => 0,
          'profit' => 0
        ];
      }
      
      $dailyData[$date]['sales']  += $saleAmount;
      $dailyData[$date]['cost']   += $t['import_price'] * $t['quantity'];
      $dailyData[$date]['profit']  = $dailyData[$date]['sales'] - $dailyData[$date]['cost'];
    }
    $dailyData = array_values($dailyData);
    
    // Prepare profit by category
    $profitByCategory = [];
    foreach ($transactions as $t) {
      $category   = $t['category'] ?: 'Uncategorized';
      $saleAmount = $t['Sold_Price'];
      $costAmount = $t['import_price'] * $t['quantity'];
      $profit     = $saleAmount - $costAmount;
      
      if (!isset($profitByCategory[$category])) {
        $profitByCategory[$category] = 0;
      }
      $profitByCategory[$category] += $profit;
    }
    $profitByCategoryData = [];
    foreach ($profitByCategory as $category => $profit) {
      $profitByCategoryData[] = [
        'category' => $category,
        'profit'   => $profit
      ];
    }
    
    // Add unit_price and total_sale fields to each transaction
    foreach ($transactions as &$t) {
      // unit price, avoiding division by zero
      $t['unit_price'] = ($t['quantity'] > 0)
        ? $t['Sold_Price'] / $t['quantity']
        : 0;
      // total sale amount
      $t['total_sale'] = $t['Sold_Price'];
    }
    unset($t); // break the reference
    
    // Final JSON response
    echo json_encode([
      'metrics' => [
        'totalSales'    => $totalSales,
        'totalCost'     => $totalCost,
        'totalProfit'   => $totalProfit,
        'totalSpending' => $totalSpending,
        'netProfit'     => $netProfit
      ],
      'dailyData'        => $dailyData,
      'profitByCategory' => $profitByCategoryData,
      'transactions'     => $transactions,
      'spendings'        => $spendings
    ]);
    
  } catch (PDOException $e) {
    send_error(500, 'Error generating report', $e->getMessage());
  }
  break;

  
        default:
            send_error(404, 'Invalid action');
    }
} catch (Exception $e) {
    send_error(500, 'A server error occurred.', "Server Error in action '{$action}': " . $e->getMessage());
}