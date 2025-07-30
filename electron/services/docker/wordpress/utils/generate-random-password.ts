export default function generateRandomPassword(length: number = 16): string {
    const charset = 'SJ4Mmr5e@v6ewzRSLthZG1zJ$8PeDcM2Nru3a!pt@^*a9cHY*ZzFngcV4q%wVdeqabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}