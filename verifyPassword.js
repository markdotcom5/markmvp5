const bcrypt = require('bcrypt');

const enteredPassword = "CaccMSpvEvU9lLh1."; // The password you are testing
const storedHash = "$2b$10$XphJL7uixw//poIxx4wGWOeJ4Dc8/f2R3G/xm5GFNMuDqLlGAH8iu"; // The hash from MongoDB

bcrypt.compare(enteredPassword, storedHash, (err, isMatch) => {
    if (err) throw err;
    console.log("Do passwords match?", isMatch);
});
