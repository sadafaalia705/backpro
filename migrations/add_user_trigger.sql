-- Create trigger to automatically insert card sequence for new users
DELIMITER $$

CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO card_sequence (user_id) VALUES (NEW.user_id);
END$$

DELIMITER ;