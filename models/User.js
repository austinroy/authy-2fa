import mongoose, { Schema } from 'mongoose';

var UserSchema = new Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true},
    
    authyId: String,
    hashed_password: String
});

const User = mongoose.model('User', UserSchema);

export default User;