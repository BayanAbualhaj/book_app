
DROP TABLE IF EXISTS library;

CREATE TABLE books (
    id SERIAL PRIMARY KEY NOT NULL,
    author VARCHAR,
    title VARCHAR,
    isbn VARCHAR,
    image_url VARCHAR,
    description VARCHAR
);