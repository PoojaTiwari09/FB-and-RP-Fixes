SELECT id, email, md5(email), encode(convert_to(email, 'UTF8'), 'hex') AS hex FROM "User";
