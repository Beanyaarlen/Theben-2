<?php
declare(strict_types=1);
ini_set('display_errors','0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
function esc($v): string { return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function basepath(): string { return rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME'])), '/'); }
function db(): PDO {
 static $pdo;
 if ($pdo) return $pdo;
 if (!is_file(__DIR__.'/private/config.php')) { http_response_code(503); exit('Konfigurasi belum tersedia. Ikuti PANDUAN_HOSTINGER.txt.'); }
 $c=require __DIR__.'/private/config.php';
 try { $pdo=new PDO($c['dsn'],$c['user'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]); }
 catch(Throwable $e) { error_log('CMS database connection failed');http_response_code(503);exit('Database belum tersambung. Periksa konfigurasi database.'); }
 return $pdo;
}
function startSession(): void {
 session_name('theben_admin');
 session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','samesite'=>'Strict','path'=>(basepath()?:'').'/']);
 session_start();
 if (!isset($_SESSION['csrf'])) $_SESSION['csrf']=bin2hex(random_bytes(32));
 header('Cache-Control: no-store');header('X-Frame-Options: DENY');
}
function csrf(): void { if (!hash_equals($_SESSION['csrf'],(string)($_POST['csrf']??''))) {http_response_code(403);exit('Sesi formulir tidak valid. Muat ulang halaman.');} }
function fieldValid(string $prop,string $value): bool {
 if (strlen($value)>100000) return false;
 if (in_array($prop,['href','src','data-image'],true)) {
  if (preg_match('/[\x00-\x20\\\\]/',$value)) return false;
  if (str_starts_with($value,'//')) return false;
  $scheme=parse_url($value,PHP_URL_SCHEME);
  if ($scheme && !in_array(strtolower($scheme),$prop==='href'?['https','http','mailto','tel']:['https','http'],true)) return false;
 }
 return true;
}
