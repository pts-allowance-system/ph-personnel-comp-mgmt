const bcrypt = require('bcryptjs');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const saltRounds = 10; // Standard salt rounds

readline.question('Enter the password to hash: ', (password) => {
  if (!password) {
    console.error('Password cannot be empty.');
    readline.close();
    process.exit(1);
  }

  bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
      console.error('Error hashing password:', err);
    } else {
      console.log(`Bcrypt hash: ${hash}`);
    }
    readline.close();
  });
});
