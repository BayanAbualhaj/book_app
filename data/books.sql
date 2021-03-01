DROP TABLE IF EXEST library

CREATE TABLE books(
    id SERIAL PRIMARY KYE,
    title VARCHAR(255),
    isbn VARCHAR(255),
    image_url VARCHAR(255),
    description VARCHAR(255)
);