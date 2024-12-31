<?php
echo "<h2>Apache Modules</h2>";
print_r(apache_get_modules());

echo "<h2>Server Software</h2>";
echo $_SERVER['SERVER_SOFTWARE'];

echo "<h2>PHP Version</h2>";
echo phpversion();

echo "<h2>Current Directory</h2>";
echo getcwd();

echo "<h2>Environment Variables</h2>";
print_r($_ENV);
?>
