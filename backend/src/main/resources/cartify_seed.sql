BEGIN;

INSERT INTO categories (id, name, description, image_url)
VALUES
    (
        '9f64f664-5b5d-4a2a-bfbb-d0f35785f5c1',
        'Electronics',
        'Smart devices, audio gear, and everyday tech accessories.',
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80'
    ),
    (
        '3f4789ea-9ed9-4702-a14d-4704f8f7f9a2',
        'Clothing',
        'Comfortable and stylish apparel for daily wear.',
        'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80'
    ),
    (
        'f0fd58a5-3e1e-4f52-bec8-f8f25b2518f3',
        'Home & Kitchen',
        'Practical home essentials and modern kitchen tools.',
        'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80'
    );

INSERT INTO products (id, name, description, price, stock_quantity, image_url, category_id)
VALUES
    (
        'a8b1f695-c0a7-4c2e-9b8e-11d56f04f8a1',
        'Wireless Noise-Cancelling Headphones',
        'Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.',
        129.99,
        45,
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
        '9f64f664-5b5d-4a2a-bfbb-d0f35785f5c1'
    ),
    (
        '2fb8c71b-26d7-4542-b1da-0cad11f0a902',
        '4K Ultra HD Streaming Stick',
        'Compact media stick with 4K streaming support, voice remote, and dual-band Wi-Fi.',
        59.00,
        120,
        'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=80',
        '9f64f664-5b5d-4a2a-bfbb-d0f35785f5c1'
    ),
    (
        'd7788fd4-64f8-4fca-b4a4-7eeb2462a903',
        'USB-C Fast Charger 65W',
        'Single-port USB-C wall charger designed for laptops, tablets, and smartphones.',
        29.99,
        250,
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80',
        '9f64f664-5b5d-4a2a-bfbb-d0f35785f5c1'
    ),
    (
        '9d35e2cf-5b6a-4f87-8b23-2d6a65e7b904',
        'Men''s Slim Fit Chino Pants',
        'Breathable cotton-blend chinos with a tapered fit for casual or office wear.',
        49.99,
        80,
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
        '3f4789ea-9ed9-4702-a14d-4704f8f7f9a2'
    ),
    (
        '6c2af37a-97b4-4e9c-b0af-c5713cf4b905',
        'Women''s Lightweight Denim Jacket',
        'Classic denim jacket with soft stretch fabric and button-front closure.',
        69.50,
        60,
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
        '3f4789ea-9ed9-4702-a14d-4704f8f7f9a2'
    ),
    (
        '0b4f6d66-b4cf-46f6-a6f0-38618f9a7906',
        'Unisex Everyday Running Shoes',
        'Cushioned running shoes with breathable mesh upper and durable rubber outsole.',
        89.00,
        95,
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
        '3f4789ea-9ed9-4702-a14d-4704f8f7f9a2'
    ),
    (
        '5dcf4d47-4262-4f4e-97f9-6ff67df34607',
        'Stainless Steel Cookware Set (10-Piece)',
        'Induction-compatible cookware set with tempered glass lids and stay-cool handles.',
        179.99,
        40,
        'https://images.unsplash.com/photo-1584990347449-a1f4f8fa6f35?auto=format&fit=crop&w=900&q=80',
        'f0fd58a5-3e1e-4f52-bec8-f8f25b2518f3'
    ),
    (
        'd07d0b9b-95f1-41d0-9a8f-a470d4a9b408',
        'Smart Air Fryer 6L',
        'Touch-control air fryer with 8 presets, rapid hot-air circulation, and auto shut-off.',
        119.00,
        55,
        'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=900&q=80',
        'f0fd58a5-3e1e-4f52-bec8-f8f25b2518f3'
    ),
    (
        'f9348a86-7278-451e-b6eb-c8620ec0de09',
        'Bamboo Cutting Board Set (3-Pack)',
        'Three eco-friendly bamboo boards in multiple sizes for slicing and meal prep.',
        24.99,
        130,
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
        'f0fd58a5-3e1e-4f52-bec8-f8f25b2518f3'
    );

COMMIT;
