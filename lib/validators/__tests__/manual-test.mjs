import { validateEmail } from '../email.ts';
import { validatePassword } from '../password.ts';

// Test email validator
console.log('Testing Email Validator:');
console.log('Valid email:', validateEmail('user@example.com'));
console.log('Invalid email:', validateEmail('notanemail'));
console.log('Empty email:', validateEmail(''));

// Test password validator
console.log('\nTesting Password Validator:');
console.log('Strong password:', validatePassword('MyPassword123!'));
console.log('Weak password:', validatePassword('weak'));
console.log('Empty password:', validatePassword(''));

console.log('\n✅ Basic manual validation complete');
