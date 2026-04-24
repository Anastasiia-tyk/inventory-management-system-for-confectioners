-- ────────────────────────────────────────────────────────────────────
-- 1. КОРИСТУВАЧІ
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,           -- bcrypt hash
    role        ENUM('manager','chef','admin') NOT NULL DEFAULT 'manager',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
);

-- ────────────────────────────────────────────────────────────────────
-- 2. ІНГРЕДІЄНТИ (майстер-список)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ingredients (
    id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    user_id       VARCHAR(36)  NOT NULL,
    name          VARCHAR(150) NOT NULL,
    unit          VARCHAR(20)  NOT NULL DEFAULT 'кг',   -- кг, г, л, мл, шт, уп
    min_threshold DECIMAL(10,3) NOT NULL DEFAULT 0,      -- мінімальний поріг для сповіщення
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ing_user (user_id)
);

-- ────────────────────────────────────────────────────────────────────
-- 3. ЗАЛИШКИ СКЛАДУ (поточні)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE inventory (
    id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
    ingredient_id VARCHAR(36)   NOT NULL UNIQUE,
    current_qty   DECIMAL(12,3) NOT NULL DEFAULT 0,
    today_used    DECIMAL(12,3) NOT NULL DEFAULT 0,     -- скинається щодня
    last_updated  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────────────
-- 4. ПРОДУКТИ (кондитерські вироби)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE products (
    id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    user_id    VARCHAR(36)  NOT NULL,
    name       VARCHAR(150) NOT NULL,
    icon       VARCHAR(10)  NOT NULL DEFAULT '🎂',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_prod_user (user_id)
);

-- ────────────────────────────────────────────────────────────────────
-- 5. РЕЦЕПТУРНІ КАРТКИ (вбудовані в продукт)
--    recipe_items[].qty_per_unit = кількість інгредієнта на 1 виріб
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE recipe_items (
    id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
    product_id    VARCHAR(36)   NOT NULL,
    ingredient_id VARCHAR(36)   NOT NULL,
    qty_per_unit  DECIMAL(10,4) NOT NULL,   -- на 1 виріб
    unit          VARCHAR(20)   NOT NULL,
    FOREIGN KEY (product_id)    REFERENCES products(id)    ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    UNIQUE KEY uq_recipe_item (product_id, ingredient_id),
    INDEX idx_recipe_prod (product_id)
);

-- ────────────────────────────────────────────────────────────────────
-- 6. ВИРОБНИЧІ ЗАПИСИ (щоденний лічильник)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE production_logs (
    id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    user_id      VARCHAR(36)  NOT NULL,
    date         DATE         NOT NULL,
    confirmed    BOOLEAN      NOT NULL DEFAULT FALSE,
    confirmed_at DATETIME     DEFAULT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_prod_log_user_date (user_id, date)
);

-- Деталі виробничого запису (які продукти і скільки)
CREATE TABLE production_log_items (
    id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    production_log_id VARCHAR(36) NOT NULL,
    product_id      VARCHAR(36) NOT NULL,
    qty             INT         NOT NULL DEFAULT 0,
    FOREIGN KEY (production_log_id) REFERENCES production_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)        REFERENCES products(id)        ON DELETE CASCADE,
    INDEX idx_pli_log (production_log_id)
);

-- ────────────────────────────────────────────────────────────────────
-- 7. ЖУРНАЛ ЗМІН СКЛАДУ (аудиторський слід)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE inventory_logs (
    id                  VARCHAR(36)    PRIMARY KEY DEFAULT (UUID()),
    ingredient_id       VARCHAR(36)    NOT NULL,
    change_type         ENUM('deduction','restock','correction') NOT NULL,
    qty_change          DECIMAL(12,3)  NOT NULL,   -- від'ємне = списання
    qty_after           DECIMAL(12,3)  NOT NULL,   -- залишок після зміни
    source_type         VARCHAR(30)    DEFAULT NULL,  -- 'production', 'purchase', 'manual'
    source_id           VARCHAR(36)    DEFAULT NULL,  -- ID пов'язаного запису
    user_id             VARCHAR(36)    NOT NULL,
    note                VARCHAR(255)   DEFAULT NULL,
    created_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
    INDEX idx_inv_log_ing  (ingredient_id),
    INDEX idx_inv_log_date (created_at)
);

-- ────────────────────────────────────────────────────────────────────
-- 8. ЗАКУПІВЛІ (поповнення від постачальників)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE purchase_logs (
    id            VARCHAR(36)    PRIMARY KEY DEFAULT (UUID()),
    ingredient_id VARCHAR(36)    NOT NULL,
    qty_received  DECIMAL(12,3)  NOT NULL,
    unit          VARCHAR(20)    NOT NULL,
    supplier      VARCHAR(200)   DEFAULT NULL,
    user_id       VARCHAR(36)    NOT NULL,
    date          DATE           NOT NULL,
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
    INDEX idx_purchase_date (date),
    INDEX idx_purchase_ing  (ingredient_id)
);

-- ────────────────────────────────────────────────────────────────────
-- 9. СПОВІЩЕННЯ (автоматичні попередження)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
    user_id       VARCHAR(36)   NOT NULL,
    ingredient_id VARCHAR(36)   NOT NULL,
    current_qty   DECIMAL(12,3) NOT NULL,
    min_threshold DECIMAL(12,3) NOT NULL,
    message       TEXT          NOT NULL,
    is_read       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    INDEX idx_notif_user   (user_id),
    INDEX idx_notif_unread (user_id, is_read)
);

-- ════════════════════════════════════════════════════════════════════
--  КОРИСНІ ПРЕДСТАВЛЕННЯ (VIEWS)
-- ════════════════════════════════════════════════════════════════════

-- Поточний стан складу (з назвами інгредієнтів та статусом)
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT
    i.id            AS ingredient_id,
    i.name          AS ingredient_name,
    i.unit,
    i.min_threshold,
    inv.current_qty,
    inv.today_used,
    CASE
        WHEN inv.current_qty < i.min_threshold            THEN 'critical'
        WHEN inv.current_qty < i.min_threshold * 1.5      THEN 'warning'
        ELSE                                                    'ok'
    END             AS status,
    ROUND(inv.current_qty / NULLIF(i.min_threshold * 3, 0) * 100, 1) AS fill_pct
FROM ingredients i
LEFT JOIN inventory inv ON inv.ingredient_id = i.id;

-- Статистика виробництва по продуктах (за останній місяць)
CREATE OR REPLACE VIEW v_production_stats AS
SELECT
    p.name          AS product_name,
    p.icon,
    SUM(pli.qty)    AS total_qty,
    COUNT(DISTINCT pl.date) AS active_days
FROM production_log_items pli
JOIN production_logs pl ON pl.id = pli.production_log_id AND pl.confirmed = TRUE
JOIN products p          ON p.id = pli.product_id
WHERE pl.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY p.id, p.name, p.icon
ORDER BY total_qty DESC;

-- Середня щоденна витрата інгредієнтів (для прогнозу)
CREATE OR REPLACE VIEW v_avg_daily_consumption AS
SELECT
    i.id            AS ingredient_id,
    i.name          AS ingredient_name,
    i.unit,
    ROUND(SUM(ri.qty_per_unit * pli.qty) /
          NULLIF(COUNT(DISTINCT pl.date), 0), 4) AS avg_daily_qty
FROM recipe_items ri
JOIN products p              ON p.id  = ri.product_id
JOIN production_log_items pli ON pli.product_id = p.id
JOIN production_logs pl      ON pl.id = pli.production_log_id AND pl.confirmed = TRUE
JOIN ingredients i           ON i.id  = ri.ingredient_id
WHERE pl.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY i.id, i.name, i.unit;

-- ════════════════════════════════════════════════════════════════════
--  ЗБЕРЕЖЕНІ ПРОЦЕДУРИ
-- ════════════════════════════════════════════════════════════════════

DELIMITER $$

-- Підтвердження денного виробництва + автоматичне списання
CREATE PROCEDURE sp_confirm_production(
    IN p_log_id  VARCHAR(36),
    IN p_user_id VARCHAR(36)
)
BEGIN
    DECLARE done        INT DEFAULT FALSE;
    DECLARE v_prod_id   VARCHAR(36);
    DECLARE v_prod_qty  INT;
    DECLARE v_ing_id    VARCHAR(36);
    DECLARE v_qty_each  DECIMAL(10,4);
    DECLARE v_unit      VARCHAR(20);
    DECLARE v_ing_name  VARCHAR(150);
    DECLARE v_curr_qty  DECIMAL(12,3);
    DECLARE v_new_qty   DECIMAL(12,3);
    DECLARE v_min_thr   DECIMAL(12,3);
    DECLARE v_total_deduct DECIMAL(12,3);

    -- Курсор по рядках виробничого запису
    DECLARE cur_items CURSOR FOR
        SELECT pli.product_id, pli.qty
        FROM production_log_items pli
        WHERE pli.production_log_id = p_log_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Перевірка: запис вже підтверджено?
    IF (SELECT confirmed FROM production_logs WHERE id = p_log_id) = TRUE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Запис вже підтверджено';
    END IF;

    START TRANSACTION;

    OPEN cur_items;
    read_loop: LOOP
        FETCH cur_items INTO v_prod_id, v_prod_qty;
        IF done THEN LEAVE read_loop; END IF;

        -- Для кожного інгредієнта в рецепті
        BEGIN
            DECLARE done2       INT DEFAULT FALSE;
            DECLARE cur_recipe CURSOR FOR
                SELECT ri.ingredient_id, ri.qty_per_unit, ri.unit, i.name
                FROM recipe_items ri
                JOIN ingredients i ON i.id = ri.ingredient_id
                WHERE ri.product_id = v_prod_id;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET done2 = TRUE;

            OPEN cur_recipe;
            recipe_loop: LOOP
                FETCH cur_recipe INTO v_ing_id, v_qty_each, v_unit, v_ing_name;
                IF done2 THEN LEAVE recipe_loop; END IF;

                SET v_total_deduct = v_qty_each * v_prod_qty;

                -- Отримати поточний залишок
                SELECT current_qty, inv.ingredient_id
                INTO v_curr_qty, @dummy
                FROM inventory inv
                WHERE inv.ingredient_id = v_ing_id
                FOR UPDATE;

                SET v_new_qty = GREATEST(0, v_curr_qty - v_total_deduct);

                -- Оновити залишок
                UPDATE inventory
                SET current_qty = v_new_qty,
                    today_used  = today_used + v_total_deduct
                WHERE ingredient_id = v_ing_id;

                -- Записати в журнал
                INSERT INTO inventory_logs
                    (ingredient_id, change_type, qty_change, qty_after,
                     source_type, source_id, user_id, note)
                VALUES
                    (v_ing_id, 'deduction', -v_total_deduct, v_new_qty,
                     'production', p_log_id, p_user_id,
                     CONCAT('Виробництво: ', v_prod_qty, ' шт.'));

                -- Перевірити мінімальний поріг → сповіщення
                SELECT min_threshold INTO v_min_thr
                FROM ingredients WHERE id = v_ing_id;

                IF v_new_qty < v_min_thr THEN
                    INSERT INTO notifications
                        (user_id, ingredient_id, current_qty, min_threshold, message)
                    VALUES
                        (p_user_id, v_ing_id, v_new_qty, v_min_thr,
                         CONCAT('Залишок "', v_ing_name, '" (', v_new_qty, ' ', v_unit,
                                ') нижче мінімуму (', v_min_thr, ' ', v_unit, ')!'));
                END IF;

            END LOOP recipe_loop;
            CLOSE cur_recipe;
        END;
    END LOOP read_loop;
    CLOSE cur_items;

    -- Позначити запис як підтверджений
    UPDATE production_logs
    SET confirmed = TRUE, confirmed_at = NOW()
    WHERE id = p_log_id;

    COMMIT;
END$$

-- Скидання today_used (запускати о 00:00 через планувальник)
CREATE PROCEDURE sp_reset_daily_counters()
BEGIN
    UPDATE inventory SET today_used = 0;
    -- Optionally: log the reset
    SELECT ROW_COUNT() AS rows_reset;
END$$

DELIMITER ;

-- ════════════════════════════════════════════════════════════════════
--  ПЛАНУВАЛЬНИК ПОДІЙ (Event Scheduler)
-- ════════════════════════════════════════════════════════════════════
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS evt_reset_daily_counters
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY)
DO CALL sp_reset_daily_counters();

-- ════════════════════════════════════════════════════════════════════
--  ДЕМО-ДАНІ
-- ════════════════════════════════════════════════════════════════════

-- Демо-користувач (пароль: 123456 → bcrypt)
INSERT INTO users (id, name, email, password, role) VALUES
('u-demo-001', 'Олена Коваль', 'manager@test.com',
 '$2b$10$K8pRLwV3v8sYE1MxiuqVzeGiWqLhkdQU4tFnmUuR.Oer8J5FhQ8Ma', 'manager');

-- Інгредієнти
INSERT INTO ingredients (id, user_id, name, unit, min_threshold) VALUES
('i-001','u-demo-001','Борошно пшеничне','кг',5),
('i-002','u-demo-001','Цукор',           'кг',3),
('i-003','u-demo-001','Масло вершкове',  'кг',2),
('i-004','u-demo-001','Яйця курячі',     'шт',30),
('i-005','u-demo-001','Молоко',          'л', 3),
('i-006','u-demo-001','Вершки 33%',      'л', 2),
('i-007','u-demo-001','Какао-порошок',   'кг',1),
('i-008','u-demo-001','Шоколад чорний',  'кг',1),
('i-009','u-demo-001','Розпушувач',      'г', 100),
('i-010','u-demo-001','Ванільний екстракт','мл',50);

-- Залишки складу
INSERT INTO inventory (ingredient_id, current_qty) VALUES
('i-001',15.00),('i-002',10.00),('i-003',8.00),('i-004',120),
('i-005',12.00),('i-006',6.00), ('i-007',3.00), ('i-008',4.00),
('i-009',500),  ('i-010',200);

-- Продукти
INSERT INTO products (id, user_id, name, icon) VALUES
('p-001','u-demo-001','Торт Наполеон',    '🎂'),
('p-002','u-demo-001','Шоколадний брауні','🍫'),
('p-003','u-demo-001','Профітролі (15 шт)','🍰'),
('p-004','u-demo-001','Ванільний бісквіт','🧁');

-- Рецептури
INSERT INTO recipe_items (product_id, ingredient_id, qty_per_unit, unit) VALUES
-- Торт Наполеон
('p-001','i-001',0.35,'кг'),('p-001','i-002',0.20,'кг'),
('p-001','i-003',0.25,'кг'),('p-001','i-004',3,   'шт'),
('p-001','i-005',0.40,'л'),
-- Брауні
('p-002','i-008',0.10,'кг'),('p-002','i-003',0.08,'кг'),
('p-002','i-002',0.12,'кг'),('p-002','i-004',2,   'шт'),
('p-002','i-007',0.03,'кг'),
-- Профітролі
('p-003','i-001',0.15,'кг'),('p-003','i-003',0.08,'кг'),
('p-003','i-004',4,   'шт'),('p-003','i-006',0.20,'л'),
-- Бісквіт
('p-004','i-001',0.20,'кг'),('p-004','i-002',0.18,'кг'),
('p-004','i-004',5,   'шт'),('p-004','i-009',5,   'г'),
('p-004','i-010',5,   'мл');

-- ════════════════════════════════════════════════════════════════════
--  КОРИСНІ ЗАПИТИ ДЛЯ BACKEND
-- ════════════════════════════════════════════════════════════════════

/*
-- 1. Поточний стан складу
SELECT * FROM v_inventory_status WHERE user_id = ?;

-- 2. Рейтинг продуктів за 30 днів
SELECT * FROM v_production_stats;

-- 3. Прогноз закупівель на 7 днів (горизонт = 7, коефіцієнт безпеки = 1.3)
SELECT
    i.id, i.name, i.unit,
    adc.avg_daily_qty,
    ROUND(adc.avg_daily_qty * 7 * 1.3, 3)       AS forecast_needed,
    inv.current_qty                               AS in_stock,
    GREATEST(0, ROUND(adc.avg_daily_qty * 7 * 1.3 - inv.current_qty, 3)) AS to_purchase
FROM v_avg_daily_consumption adc
JOIN ingredients i   ON i.id  = adc.ingredient_id
JOIN inventory inv   ON inv.ingredient_id = i.id
WHERE GREATEST(0, ROUND(adc.avg_daily_qty * 7 * 1.3 - inv.current_qty, 3)) > 0
ORDER BY to_purchase DESC;

-- 4. Журнал змін складу (останні 20)
SELECT il.*, i.name AS ingredient_name
FROM inventory_logs il
JOIN ingredients i ON i.id = il.ingredient_id
ORDER BY il.created_at DESC LIMIT 20;

-- 5. Непрочитані сповіщення
SELECT n.*, i.name AS ingredient_name
FROM notifications n
JOIN ingredients i ON i.id = n.ingredient_id
WHERE n.user_id = ? AND n.is_read = FALSE
ORDER BY n.created_at DESC;
*/
