-- Initial Seed Data for Swadeshi Kitchen Backend

USE swadeshi_db;

-- Insert default admin user (password is 'admin123' hashed with bcrypt)
INSERT INTO admins (name, email, password)
VALUES ('Admin User', 'admin@swadeshikitchen.com', '$2a$10$4JFIObYNmqtJH8OTm2cDgO0FpN9HN0kYRpu3Kl5Y/9l9TpiZuIU5m')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert initial categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Our Special Paranthas', 'Whole wheat homestyle paranthas made fresh on tawa'),
(2, 'Snacks', 'Quick snacks, pastas, maggi and fries'),
(3, 'Thali & Rice Combos', 'Homestyle Thalis, Rajma, Chole and Dal combos'),
(4, 'Extras', 'Single curries, extra rotis and steamed rice')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert initial menu items
INSERT INTO menu_items (id, category_id, name, description, price, image_url, tag, is_veg, is_bestseller, is_available) VALUES
(1, 1, 'Paneer Parantha - 2 pcs', 'Made with whole wheat atta stuffed with fresh cottage cheese.', 189.00, 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/stuffed_paratha.png', 'Special', TRUE, TRUE, TRUE),
(2, 1, 'Aloo Parantha - 2 pcs', 'Made with whole wheat atta stuffed with spiced mashed potatoes.', 139.00, 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/stuffed_paratha.png', 'Classic', TRUE, TRUE, TRUE),
(3, 1, 'Aloo Pyaaz Parantha - 2 pcs', 'Made with whole wheat atta with spiced potato and onion filling.', 159.00, 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/stuffed_paratha.png', 'Popular', TRUE, FALSE, TRUE),
(4, 1, 'Ajwain Parantha', 'Served with Aloo Zeera. Made with whole wheat atta.', 139.00, 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/stuffed_paratha.png', 'Unique', TRUE, FALSE, TRUE),
(5, 1, 'Aloo Puri - 5 Puris', '5 Crispy Puris served hot with spiced aloo sabzi.', 119.00, 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/aloo_poori.png', 'Comfort', TRUE, TRUE, TRUE),
(6, 2, 'Grilled Sandwich - 4 Pieces', 'Classic grilled vegetable sandwich with herbs and spices.', 169.00, 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/img1.jpg', 'Classic', TRUE, FALSE, TRUE),
(7, 3, 'VEG THALI', 'Dal, Sabzi, Roti, Rice, Raita, Salad, Pickle.', 199.00, 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/veg_thali.png', 'Daily', TRUE, TRUE, TRUE),
(8, 3, 'SPECIAL VEG THALI', 'Dal, Mutter Paneer, Roti, Boondi Raita, Salad, Pickle.', 249.00, 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/veg_thali.png', 'Special', TRUE, TRUE, TRUE),
(9, 3, 'RAJMA CHAWAL', 'Classic homestyle Rajma served with steamed basmati rice.', 169.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80', 'Classic', TRUE, TRUE, TRUE),
(10, 4, 'Steamed Basmati Rice', 'Premium quality steamed basmati rice.', 79.00, 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/img3.jpg', 'Fresh', TRUE, FALSE, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);
