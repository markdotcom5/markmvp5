const bcrypt = require('bcrypt');

const password = "CaccMSpvEvU9lLh1."; // Your new password
bcrypt.hash(password, 10, function(err, hash) {
    if (err) throw err;
    console.log("Hashed Password:", hash);
});
