const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');

const SENDGRID_API_KEY = (process.env.SENDGRID_API_KEY || '').trim();

// set sendgrid API key
if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

// set up multer to store the uploaded image in RAM (buffer) temporarily
const upload = multer({ dest: 'uploads/' });
const { ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/images', express.static('public/images'));

let options = {};
if (process.env.NODE_ENV === 'production') {
    options = {
        key: fs.readFileSync('/etc/letsencrypt/live/springucfpoosdap.com/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/springucfpoosdap.com/fullchain.pem')
    };
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://springucfpoosdap.com');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
})

// HELPER FUNCTIONS

function normalizeLogin(value) {
    return (value ?? '').toString().trim();
}

function normalizeEmail(value) {
    return (value ?? '').toString().trim().toLowerCase();
}

function isValidEmail(value) {
    // _@_._
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function makeToken() {
    // make a 64 character hex token 
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
}

function makeVerifyToken() {
    return makeToken();
}

function makePasswordResetToken() {
    return makeToken();
}

async function sendVerificationEmail({ toEmail, token }) {
    const verifyUrl = `https://springucfpoosdap.com/verify-email?token=${encodeURIComponent(token)}`;

    // SendGrid Web API
    if (!SENDGRID_API_KEY) {
        console.log('SendGrid not configured. Verification URL:', verifyUrl);
        return { sent: false, verifyUrl };
    }

    const fromEmail = (process.env.SENDGRID_FROM_EMAIL || '').trim();
    const fromName = (process.env.SENDGRID_FROM_NAME || '').trim();

    if (!fromEmail) {
        console.log('SENDGRID_FROM_EMAIL missing. Verification URL:', verifyUrl);
        return { sent: false, verifyUrl };
    }

    const subject = 'Verify your email';
    const text = `Verify your email by opening this link:\n\n${verifyUrl}\n\nIf you did not create this account, you can ignore this email.`;

    // call the sendgrid api to send email
    try {
        await sgMail.send({
            to: toEmail,
            from: { email: fromEmail, name: fromName },
            subject,
            text,
            trackingSettings: {
                clickTracking: {
                    enable: false,
                    enableText: false,
                },
            },
        });
        return { sent: true, verifyUrl };
    } catch (err) {
        const sendGridDetails = err && err.response && err.response.body ? err.response.body : null;
        console.error('SendGrid send failed:', sendGridDetails || err);
        return { sent: false, verifyUrl };
    }
}

async function sendPasswordResetEmail({ toEmail, token }) {
    const resetUrl = `https://springucfpoosdap.com/reset-password?token=${encodeURIComponent(token)}`;

    // SendGrid Web API
    if (!SENDGRID_API_KEY) {
        console.log('SendGrid not configured. Password reset URL:', resetUrl);
        return { sent: false, resetUrl };
    }

    const fromEmail = (process.env.SENDGRID_FROM_EMAIL || '').trim();
    const fromName = (process.env.SENDGRID_FROM_NAME || '').trim();

    if (!fromEmail) {
        console.log('SENDGRID_FROM_EMAIL missing. Password reset URL:', resetUrl);
        return { sent: false, resetUrl };
    }

    const subject = 'Reset your password';
    const text = `Reset your password by opening this link:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;

    // call the sendgrid api to send email
    try {
        await sgMail.send({
            to: toEmail,
            from: { email: fromEmail, name: fromName },
            subject,
            text,
            trackingSettings: {
                clickTracking: {
                    enable: false,
                    enableText: false,
                },
            },
        });
        return { sent: true, resetUrl };
    } catch (err) {
        const sendGridDetails = err && err.response && err.response.body ? err.response.body : null;
        console.error('SendGrid send failed:', sendGridDetails || err);
        return { sent: false, resetUrl };
    }
}

// API ENDPOINTS

app.post('/api/signup', async (req, res) => {
    // incoming: login, email, password
    // outgoing: error

    const { login, email, password } = req.body;

    // prepare login and email (trim white spaces, lowercase)
    const normalizedLogin = normalizeLogin(login);
    const normalizedEmail = normalizeEmail(email);

    // ensure fields are not empty
    if (!normalizedLogin || !normalizedEmail || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // enforce password length requirement
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    try {
        const db = client.db('COP4331Cords');

        // check if user already exists to prevent duplicates
        const existingUser = await db.collection('Users').findOne({ Login: normalizedLogin });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already taken.' });
        }

        const existingEmail = await db.collection('Users').findOne({ Email: normalizedEmail });
        if (existingEmail) {
            return res.status(409).json({ error: 'Email already in use.' });
        }

        // hashing password
        const saltRounds = 10; // hashing iterations of 2^10
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // make email verification token and expiration time for it
        const { token, tokenHash } = makeVerifyToken();
        const expiresMinutes = 60;
        const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

        // creating user object
        const newUser = {
            Login: normalizedLogin,
            Email: normalizedEmail,
            Password: hashedPassword,
            Captures: 0, // tracks birds identified by user
            EmailVerified: false,
            EmailVerifiedAt: null,
            EmailVerifyTokenHash: tokenHash,
            EmailVerifyExpiresAt: expiresAt,
        };

        // insert into the database
        await db.collection('Users').insertOne(newUser);

        // send the verification email
        const { sent, verifyUrl } = await sendVerificationEmail({ toEmail: normalizedEmail, token });
        return res.status(200).json({ error: '', needsVerification: true, emailSent: sent, verifyUrl });

    } catch (e) {
        return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
});

app.post('/api/login', async (req, res) => {
    // incoming: login, password
    // outgoing: id, needsVerification, error

    var error = '';
    const { login, password } = req.body;
    const normalizedLogin = normalizeLogin(login);
    var id = -1;
    var needsVerification = false;

    if (!normalizedLogin || !password) {
        return res.status(400).json({
            id,
            needsVerification,
            error: 'Missing login/email or password.',
        });
    }

    try {
        const db = client.db('COP4331Cords');

        // signing in with username OR email
        const emailCandidate = normalizeEmail(normalizedLogin);
        const user = await db.collection('Users').findOne({
            $or: [{ Login: normalizedLogin }, { Email: emailCandidate }],
        });

        if (!user) {
            return res.status(401).json({
                id,
                needsVerification,
                error: 'Invalid username/email or password.',
            });
        }

        // compare provided password with hashed password in database
        const isMatch = await bcrypt.compare(password, user.Password);

        if (!isMatch) {
            return res.status(401).json({
                id,
                needsVerification,
                error: 'Invalid username/email or password.',
            });
        }

        // require verification for users who have EmailVerified set to false.
        if (user.EmailVerified === false) {
            needsVerification = true;
            return res.status(403).json({
                id,
                needsVerification,
                error: 'Email not verified.',
            });
        }

        id = user._id;
    } catch (e) {
        console.error('Login error:', e);
        return res.status(500).json({
            id,
            needsVerification,
            error: 'Internal server error. Please try again later.',
        });
    }

    return res.status(200).json({
        id,
        needsVerification,
        error: '',
    });
});

app.post('/api/verify-email', async (req, res) => {
    // incoming: token (query string)
    // outgoing: verified, error

    const token = (req.query.token ?? '').toString().trim();
    if (!token) {
        return res.status(400).json({ verified: false, error: 'Missing token.' });
    }

    // hash token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // find user w/ hashed token and set verified true 
    try {
        const db = client.db('COP4331Cords');
        const now = new Date();

        const result = await db.collection('Users').findOneAndUpdate(
            {
                EmailVerifyTokenHash: tokenHash,
                EmailVerifyExpiresAt: { $gt: now },
                EmailVerified: { $ne: true },
            },
            {
                $set: {
                    EmailVerified: true,
                    EmailVerifiedAt: now,
                },
                $unset: {
                    EmailVerifyTokenHash: '',
                    EmailVerifyExpiresAt: '',
                },
            },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            // invalid/expired token (or already verified if token still exists)
            const existing = await db.collection('Users').findOne(
                { EmailVerifyTokenHash: tokenHash },
                { projection: { EmailVerifyExpiresAt: 1, EmailVerified: 1 } }
            );

            if (existing && existing.EmailVerified === true) {
                return res.status(409).json({ verified: false, error: 'Email already verified.' });
            }

            if (existing && existing.EmailVerifyExpiresAt && new Date(existing.EmailVerifyExpiresAt) <= now) {
                return res.status(410).json({
                    verified: false,
                    error: 'Verification link expired. Please request a new one.',
                });
            }

            return res.status(400).json({ verified: false, error: 'Invalid verification link.' });
        }

        return res.status(200).json({ verified: true, id: result.value._id, error: '' });
    } catch (e) {
        console.error('Verify email error:', e);
        return res.status(500).json({ verified: false, error: 'Internal server error. Please try again later.' });
    }
});

app.post('/api/resend-verification', async (req, res) => {
    // incoming: identifier (username OR email)
    // outgoing: error, emailSent

    const identifierRaw = (req.body?.identifier ?? req.body?.login ?? '').toString();
    const identifier = identifierRaw.trim();

    if (!identifier) {
        return res.status(400).json({ error: 'Missing user\'s identifier (username or email).' });
    }

    try {
        const db = client.db('COP4331Cords');
        const emailCandidate = normalizeEmail(identifier);

        const user = await db.collection('Users').findOne({
            $or: [{ Login: identifier }, { Email: emailCandidate }],
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.', emailSent: false });
        }

        if (user.EmailVerified === true) {
            return res.status(409).json({ error: 'Email already verified.', emailSent: false });
        }

        if (!user.Email) {
            return res.status(409).json({ error: 'No email on file for this account.', emailSent: false });
        }

        // enforce minimum seconds for resend verify to avoid spam
        const minSeconds = 60;
        const lastSentAt = user.EmailVerifyLastSentAt ? new Date(user.EmailVerifyLastSentAt) : null;
        if (lastSentAt && Date.now() - lastSentAt.getTime() < minSeconds * 1000) {
            return res.status(429).json({ error: 'Please wait before requesting another email.' });
        }

        // make new token
        const { token, tokenHash } = makeVerifyToken();
        const expiresMinutes = 60;
        const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

        // update user info with new token info
        await db.collection('Users').updateOne(
            { _id: user._id },
            {
                $set: {
                    EmailVerifyTokenHash: tokenHash,
                    EmailVerifyExpiresAt: expiresAt,
                    EmailVerifyLastSentAt: new Date(),
                },
            }
        );

        const { sent, verifyUrl } = await sendVerificationEmail({ toEmail: user.Email, token });
        if (!sent) {
            return res.status(502).json({
                error: 'Failed to send verification email. Please try again later.',
                emailSent: false,
                verifyUrl,
            });
        }

        return res.status(200).json({ error: '', emailSent: true, verifyUrl });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
});

app.post('/api/request-password-reset', async (req, res) => {
    // incoming: identifier (username OR email)
    // outgoing: error, emailSent

    const identifierRaw = (req.body?.identifier ?? req.body?.login ?? req.body?.email ?? '').toString();
    const identifier = identifierRaw.trim();

    if (!identifier) {
        return res.status(400).json({ error: 'Missing identifier (username or email).' });
    }

    try {
        const db = client.db('COP4331Cords');
        const emailCandidate = normalizeEmail(identifier);

        const user = await db.collection('Users').findOne({
            $or: [{ Login: identifier }, { Email: emailCandidate }],
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.', emailSent: false });
        }

        if (!user.Email) {
            return res.status(409).json({ error: 'No email on file for this account.', emailSent: false });
        }

        // enforce minimum seconds between reset emails
        const minSeconds = 60;
        const lastSentAt = user.PasswordResetLastSentAt ? new Date(user.PasswordResetLastSentAt) : null;
        if (lastSentAt && Date.now() - lastSentAt.getTime() < minSeconds * 1000) {
            return res.status(429).json({ error: 'Please wait before requesting another reset email.' });
        }

        // make token
        const { token, tokenHash } = makePasswordResetToken();
        const expiresMinutes = 60;
        const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

        // update password reset info for user
        await db.collection('Users').updateOne(
            { _id: user._id },
            {
                $set: {
                    PasswordResetTokenHash: tokenHash,
                    PasswordResetExpiresAt: expiresAt,
                    PasswordResetLastSentAt: new Date(),
                },
            }
        );

        // send email
        const { sent, resetUrl } = await sendPasswordResetEmail({ toEmail: user.Email, token });
        if (!sent) {
            return res.status(502).json({
                error: 'Failed to send password reset email. Please try again later.',
                emailSent: false,
                resetUrl,
            });
        }

        return res.status(200).json({ error: '', emailSent: true, resetUrl });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
});

app.post('/api/reset-password', async (req, res) => {
    // incoming: token, password
    // outgoing: error

    // create token
    const token = (req.body?.token ?? '').toString().trim();
    const password = (req.body?.password ?? req.body?.newPassword ?? '').toString();

    if (!token) {
        return res.status(400).json({ error: 'Missing token.' });
    }

    if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    try {
        const db = client.db('COP4331Cords');
        const now = new Date();
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // hash + salt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // find user with the token and replace the password, reset pass info 
        const result = await db.collection('Users').findOneAndUpdate(
            {
                PasswordResetTokenHash: tokenHash,
                PasswordResetExpiresAt: { $gt: now },
            },
            {
                $set: {
                    Password: hashedPassword,
                    PasswordResetAt: now,
                },
                $unset: {
                    PasswordResetTokenHash: '',
                    PasswordResetExpiresAt: '',
                },
            },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            return res.status(400).json({ error: 'Invalid or expired reset link.' });
        }

        return res.status(200).json({ error: '' });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
});

app.post('/api/identify-birds', upload.single('image'), async (req, res) => {
    // check if image has been uploaded
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded.' });
    }

    try {
        const { client: gradioClient, handle_file } = await import("@gradio/client");

        console.log(`Sending file to the BioCLIP /lambda endpoint...`);
        const space = await gradioClient("imageomics/bioclip-2-demo");

        // caliing BioCLIP /lamba endpoint 
        const aiData = await space.predict("/lambda", [
            handle_file(req.file.path),
            "Species" // asking for species
        ]);

        console.log("AI Response Received.");

        // removing temporary physical image from hard drive
        fs.unlinkSync(req.file.path);

        // parse AI taxonomy string
        const fullTaxonomy = aiData.data[0].label;
        const topScore = aiData.data[0].confidences[0].confidence;
        console.log(`AI Raw Taxonomy: ${fullTaxonomy}`);

        let dbQuery = {};

        // check for common name in parentheses
        const commonNameMatch = fullTaxonomy.match(/\(([^)]+)\)/);

        if (commonNameMatch) {
            // if found, extract name from parentheses
            const commonName = commonNameMatch[1].trim();
            console.log(`Extracted Common Name: ${commonName}`);

            // search database 'Name' field (using exact match, ignoring case)
            dbQuery = { Name: { $regex: new RegExp(`^${commonName}$`, 'i') } };
        } else {
            // fall back to extracting the last scientific word in case of no parentheses, use .replace to strip out any stray punctuation
            const cleanTaxonomy = fullTaxonomy.replace(/[^a-zA-Z\s]/g, "");
            const taxonomyArray = cleanTaxonomy.trim().split(' ');
            const speciesIdentifier = taxonomyArray[taxonomyArray.length - 1];

            console.log(`Extracted Scientific Identifier: ${speciesIdentifier}`);
            // search the database 'Species' field
            dbQuery = { Species: { $regex: new RegExp(speciesIdentifier, 'i') } };
        }

        // search MongoDB for query
        const db = client.db('COP4331Cords');
        const birdInfo = await db.collection('Birds').findOne(dbQuery);

        // if AI identified a bird that isn't native to Florida (not in DB)
        if (!birdInfo) {
            return res.status(404).json({
                error: `The AI identified this as ${fullTaxonomy}, which is not in our Florida birds database.`
            });
        }

        // send the matched bird to the frontend
        res.status(200).json({
            error: "",
            id: birdInfo._id,
            index: birdInfo.ID,
            name: birdInfo.Name,
            image: birdInfo.Image,
            color: birdInfo.Color,
            order: birdInfo.Order,
            family: birdInfo.Family,
            genus: birdInfo.Genus,
            species: birdInfo.Species,
            aiConfidenceScore: topScore,
            foundCity: null,
            foundDate: null,
        });

    } catch (error) {
        // ensure temporary file gets deleted even if the AI crashes
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Gradio Error:", error);
        res.status(500).json({ error: 'Failed to process AI request.' });
    }
});

app.post('/api/addcard', async (req, res) => {
    // incoming: userId, color
    // outgoing: error

    const { userId, card } = req.body;

    if (!userId || !card) {
        return res.status(400).json({ error: 'Missing userId or card.' });
    }

    const newCard = { Card: card, UserId: userId };
    var error = '';

    try {
        const db = client.db('COP4331Cords');
        const result = await db.collection('Cards').insertOne(newCard);
    }
    catch (e) {
        console.error('Add card error:', e);
        return res.status(500).json({ error: 'Failed to add card.' });
    }

    cardList.push(card);

    var ret = { error: error };
    return res.status(200).json(ret);
});

app.post('/api/searchcards', async (req, res) => {
    // incoming: userId, search
    // outgoing: results[], error

    var error = '';

    const { userId, search } = req.body;

    var _search = (search ?? '').toString().trim();

    const db = client.db('COP4331Cords');
    const results = await db.collection('Cards').find({ "Card": { $regex: _search + '.*', $options: 'i' } }).toArray();

    var _ret = [];
    for (var i = 0; i < results.length; i++) {
        _ret.push(results[i].Card);
    }

    var ret = { results: _ret, error: error };
    res.status(200).json(ret);
});

app.post('/api/searchbirds', async (req, res) => {
    // incoming: search
    // outgoing: results[], error

    var error = '';
    const { search } = req.body;
    var _search = (search ?? '').toString().trim();

    try {
        const db = client.db('COP4331Cords');

        // Searches the 'Birds' collection by a field named 'Name'. 
        const results = await db.collection('Birds').find({ "Name": { $regex: _search + '.*', $options: 'i' } }).toArray();

        var _ret = [];
        for (var i = 0; i < results.length; i++) {
            _ret.push(results[i]);
        }

        res.status(200).json({ results: _ret, error: error });
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

app.post('/api/save-bird', async (req, res) => {
    const { userId, birdId } = req.body;

    if (userId == null || userId === '' || birdId == null || birdId === '') {
        return res.status(400).json({ error: 'Missing userId or birdId' });
    }

    // optional fields
    const foundCity = req.body?.foundCity ?? req.body?.city;
    const foundDate = req.body?.foundDate ?? req.body?.date;

    try {
        const db = client.db('COP4331Cords');
        const usersCollection = db.collection('Users');

        // get user profile
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const birdIndex = String(birdId);

        const saved = Array.isArray(user.identfiedBirds) ? [...user.identfiedBirds] : [];

        // find existing entry in either shape
        let existingIndex = -1;
        for (let i = 0; i < saved.length; i++) {
            const entry = saved[i];
            const entryId = (entry && typeof entry === 'object') ? entry.birdId : entry;
            if (String(entryId) === birdIndex) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex === -1) {
            const newEntry = { birdId: birdIndex };
            if (foundCity !== undefined) newEntry.foundCity = foundCity;
            if (foundDate !== undefined) newEntry.foundDate = foundDate;
            saved.push(newEntry);
        } else {
            // already saved: treat as update (fields optional)
            const current = saved[existingIndex];
            const obj = (current && typeof current === 'object') ? { ...current } : { birdId: birdIndex };
            if (foundCity !== undefined) obj.foundCity = foundCity;
            if (foundDate !== undefined) obj.foundDate = foundDate;
            saved[existingIndex] = obj;
        }

        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { identfiedBirds: saved } }
        );

        return res.status(200).json({
            error: '',
            message: 'Bird successfully added to Floridex!'
        });

    } catch (error) {
        console.error("Save Bird Error:", error);
        res.status(500).json({ error: 'Failed to save bird to user profile.' });
    }
});

app.post('/api/delete-saved-bird', async (req, res) => {
    // incoming: userId, birdId
    // outgoing: error

    const { userId, birdId } = req.body;

    if (userId == null || userId === '' || birdId == null || birdId === '') {
        return res.status(400).json({ error: 'Missing userId or birdId' });
    }

    try {
        const db = client.db('COP4331Cords');
        const usersCollection = db.collection('Users');

        // find user
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const birdIndex = String(birdId);
        const saved = Array.isArray(user.identfiedBirds) ? user.identfiedBirds : [];

        // filter out the bird chosen
        const filtered = saved.filter((entry) => {
            const entryId = (entry && typeof entry === 'object') ? entry.birdId : entry;
            return String(entryId) !== birdIndex;
        });

        // update user's list with filter
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { identfiedBirds: filtered } }
        );

        return res.status(200).json({ error: '' });
    } catch (error) {
        console.error('Delete Saved Bird Error:', error);
        return res.status(500).json({ error: 'Failed to delete saved bird.' });
    }
});

app.post('/api/get-saved-birds', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        const db = client.db('COP4331Cords');

        const user = await db.collection('Users').findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const saved = Array.isArray(user.identfiedBirds) ? user.identfiedBirds : [];
        if (saved.length === 0) {
            return res.status(200).json({ error: '', identfiedBirds: [] });
        }

        const birdIDs = saved
            .map((b) => (b && typeof b === 'object') ? Number(b.birdId) : Number(b))
            .filter((n) => Number.isFinite(n));

        // get bird and sort by ID
        const birds = await db.collection('Birds')
            .find({ ID: { $in: birdIDs } })
            .sort({ Index: 1 })
            .toArray();

        // merge per-user metadata into each bird
        const metaById = new Map();
        for (const b of saved) {
            if (!b || typeof b !== 'object') continue;
            const key = String(b.birdId);
            if (metaById.has(key)) continue;
            metaById.set(key, {
                foundCity: b.foundCity ?? null,
                foundDate: b.foundDate ?? null,
            });
        }

        // append birds with the metadata for foundCity
        const birdsWithMeta = birds.map((bird) => {
            const meta = metaById.get(String(bird.ID)) || { foundCity: null, foundDate: null };
            return {
                ...bird,
                foundCity: meta.foundCity,
                foundDate: meta.foundDate,
            };
        });

        res.status(200).json({
            error: '',
            identfiedBirds: birdsWithMeta
        });

    } catch (error) {
        console.error("Get Saved Birds Error:", error);
        res.status(500).json({ error: 'Failed to retrieve saved birds.' });
    }
});

// Only serve static Linux files if in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('/var/www/html'));
    app.get('*', (req, res) => {
        res.sendFile(path.join('/var/www/html', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

let server;

async function start() {
    try {
        await client.connect();
        console.log('MongoDB connected');

        if (process.env.NODE_ENV === 'production') {
            server = https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
                console.log(`HTTPS Production Server running on port ${PORT}`);
            });
        } else {
            server = app.listen(PORT, () => {
                console.log(`Local HTTP Dev Server running on http://localhost:${PORT}`);
            });
        }

        process.on('SIGINT', async () => {
            console.log('Shutting down...');
            await client.close();
            if (server) {
                server.close(() => {
                    console.log('HTTP/HTTPS server closed.');
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        });

    } catch (err) {
        console.error('Mongo connect error:', err);
        process.exit(1);
    }

}

start();