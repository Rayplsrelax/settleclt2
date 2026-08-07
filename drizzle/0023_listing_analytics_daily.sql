-- Daily analytics snapshots for premium listing charts
CREATE TABLE IF NOT EXISTS listing_analytics_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serviceKey VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  views INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  leads INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_servicekey_date (serviceKey, `date`)
);
