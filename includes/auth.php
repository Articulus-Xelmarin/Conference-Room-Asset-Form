<?php
// Shared authentication guard for protected pages.
// Default password: admin
// Change password via the Settings page, or update includes/auth_password.php directly.

$_auth_hash_file = __DIR__ . '/auth_password.php';
$_auth_hash = is_readable($_auth_hash_file) ? (include $_auth_hash_file) : '$2y$10$EsYFSn1ZSq.SDM43k6ZSguTk4sfdAPE7IKdt1r5KMWxiRo5wT53Qa';

define('AUTH_SESSION_KEY', 'room_admin_auth');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Handle logout
if (isset($_GET['logout'])) {
    $_SESSION[AUTH_SESSION_KEY] = false;
    session_destroy();
    header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
    exit;
}

// Handle login submission
$_auth_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['_auth_password'])) {
    $submitted = $_POST['_auth_password'] ?? '';
    if (password_verify($submitted, $_auth_hash)) {
        $_SESSION[AUTH_SESSION_KEY] = true;
        header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
        exit;
    } else {
        $_auth_error = 'Incorrect password. Please try again.';
    }
}

// If not authenticated, show login wall and stop
if (empty($_SESSION[AUTH_SESSION_KEY])) {
    $depth = substr_count(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/') - 2;
    $prefix = str_repeat('../', max(0, $depth));
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin Login</title>
  <link rel="stylesheet" href="<?= $prefix ?>css/theme-dark.css" />
  <link rel="stylesheet" href="<?= $prefix ?>css/theme-light.css" />
  <link rel="stylesheet" href="<?= $prefix ?>css/base.css" />
  <style>
    .auth-wrap { display:flex; justify-content:center; align-items:center; min-height:80vh; }
    .auth-card { width:100%; max-width:360px; padding:2rem 2.5rem; }
    .auth-card h2 { margin:0 0 1.5rem; font-size:1.25rem; text-align:center; }
    .auth-card label { display:block; margin-bottom:1.25rem; }
    .auth-error { color:#e55; font-size:.875rem; margin-bottom:1rem; text-align:center; }
    .auth-card .btn { width:100%; margin-top:.5rem; }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <div class="hdr-flex">
        <div class="hdr-brand">
          <img src="<?= $prefix ?>Form_Logo.png" alt="Logo" class="site-logo" />
        </div>
      </div>
    </div>
  </header>
  <main class="wrap">
    <div class="auth-wrap">
      <form method="post" class="card auth-card" autocomplete="off">
        <h2>&#x1F512; Admin Login</h2>
        <?php if ($_auth_error): ?>
          <p class="auth-error"><?= htmlspecialchars($_auth_error) ?></p>
        <?php endif; ?>
        <label>
          Password
          <input type="password" name="_auth_password" autofocus required />
        </label>
        <button type="submit" class="btn">Login</button>
      </form>
    </div>
  </main>
  <script src="<?= $prefix ?>js/theme.js"></script>
</body>
</html>
<?php
    exit;
}
