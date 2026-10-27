import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  fingerprint: { type: String, required: true },
  name: String, email: String, service: String, brief: String,
  status: { type: String, enum: ['pending', 'sending', 'sent', 'failed'], default: 'pending' },
  lockedUntil: Date, providerId: String, sentAt: Date,
}, { timestamps: true });
const limitSchema = new mongoose.Schema({
  _id: String, count: Number, expiresAt: { type: Date, expires: 0 },
}, { versionKey: false });

export function createStore(uri) {
  let ready;
  async function models() {
    if (!ready) {
      ready = (async () => {
        const connection = await mongoose.createConnection(uri, {
          maxPoolSize: 5, serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000,
        }).asPromise();
        const Enquiry = connection.model('Enquiry', enquirySchema);
        const Limit = connection.model('ContactLimit', limitSchema);
        try { await Promise.all([Enquiry.init(), Limit.init()]); }
        catch (error) { await connection.close(); throw error; }
        return { Enquiry, Limit, connection };
      })().catch(error => { ready = null; throw error; });
    }
    return ready;
  }
  return {
    async ping() {
      const { connection } = await models();
      return connection.db.admin().ping();
    },
    async takeLimit(key, max, duration) {
      const { Limit } = await models();
      const bucket = Math.floor(Date.now() / duration);
      const id = `${key}:${bucket}`;
      let counter;
      try {
        counter = await Limit.findOneAndUpdate({ _id: id }, {
          $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * duration) },
        }, { upsert: true, returnDocument: 'after' }).lean();
      } catch (error) {
        if (error.code !== 11000) throw error;
        counter = await Limit.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { returnDocument: 'after' }).lean();
      }
      return counter.count <= max;
    },
    async get(requestId) { return (await models()).Enquiry.findOne({ requestId }).lean(); },
    async create(data) {
      const { Enquiry } = await models();
      try { return (await Enquiry.create(data)).toObject(); }
      catch (error) { if (error.code === 11000) return Enquiry.findOne({ requestId: data.requestId }).lean(); throw error; }
    },
    async claim(requestId) {
      const { Enquiry } = await models();
      return Enquiry.findOneAndUpdate({ requestId, status: { $ne: 'sent' }, $or: [
        { lockedUntil: { $exists: false } }, { lockedUntil: { $lt: new Date() } },
      ] }, { $set: { status: 'sending', lockedUntil: new Date(Date.now() + 60000) } }, { returnDocument: 'after' }).lean();
    },
    async markSent(requestId, providerId) {
      await (await models()).Enquiry.updateOne({ requestId }, { $set: { status: 'sent', providerId, sentAt: new Date() }, $unset: { lockedUntil: '' } });
    },
    async markFailed(requestId) {
      await (await models()).Enquiry.updateOne({ requestId }, { $set: { status: 'failed' }, $unset: { lockedUntil: '' } });
    },
    async close() { if (ready) await (await ready).connection.close(); ready = null; },
  };
}
