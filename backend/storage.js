const fs = require('node:fs/promises');
const path = require('node:path');

class JsonComplaintStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    this.writeQueue = Promise.resolve();
  }

  async list() {
    await this.writeQueue;
    return this.readFromDisk();
  }

  async readFromDisk() {
    try {
      const contents = await fs.readFile(this.filePath, 'utf8');
      const records = JSON.parse(contents);
      if (!Array.isArray(records)) throw new Error('Complaint data file must contain an array.');
      return records;
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async save(records) {
    return this.enqueue(async () => this.writeToDisk(records));
  }

  update(mutator) {
    return this.enqueue(async () => {
      const records = await this.readFromDisk();
      const result = await mutator(records);
      await this.writeToDisk(records);
      return result;
    });
  }

  enqueue(operation) {
    const result = this.writeQueue.then(operation);
    this.writeQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  async writeToDisk(records) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(records, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temporaryPath, this.filePath);
  }
}

module.exports = { JsonComplaintStore };
