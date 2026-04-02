const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URL || 'mongodb+srv://RickLeinecker:COP4331Rocks@cluster0-4pisv.mongodb.net/COP4331?retryWrites=true&w=majority';
const client = new MongoClient(url);

(async () => {
  try {
    await client.connect();
    console.log('MongoDB connected');
    await client.close();
  } catch (err) {
    console.error('Mongo connect error:');
    console.error(err);
    process.exit(1);
  }
})();
