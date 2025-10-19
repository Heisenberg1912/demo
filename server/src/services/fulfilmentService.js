import Asset from '../models/Asset.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import FulfilmentTask from '../models/FulfilmentTask.js';
import { generateDownloadToken } from './storageService.js';
import { sendFulfilmentEmail } from './emailService.js';

const resolveApiBase = () => {
  const configured = process.env.API_BASE_URL && process.env.API_BASE_URL.trim();
  if (configured) {
    const normalized = configured.replace(/\/+$/, '');
    return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
  }
  const port = process.env.PORT || 4000;
  return `http://127.0.0.1:${port}/api`;
};

const API_BASE = resolveApiBase();

function buildDownloadLink(asset) {
  const token = generateDownloadToken(asset._id);
  return {
    asset: asset._id,
    url: `${API_BASE}/assets/${asset._id}/download?token=${token}`,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
}

export async function prepareFulfilmentForOrder(orderId) {
  const order = await Order.findById(orderId)
    .populate('user', 'email')
    .lean();
  if (!order) throw new Error('Order not found');

  const tasks = [];
  for (const item of order.items || []) {
    if (!item.product) continue;
    const product = await Product.findById(item.product).lean();
    if (!product) continue;
    const assets = await Asset.find({
      product: product._id,
      kind: 'deliverable',
      status: { $in: ['ready', 'uploaded'] },
    }).lean();
    if (!assets.length) continue;

    const links = assets.map(buildDownloadLink);
    const task = await FulfilmentTask.findOneAndUpdate(
      { order: order._id, product: product._id },
      {
        order: order._id,
        product: product._id,
        firm: item.firm,
        status: 'delivered',
        downloadLinks: links,
      },
      { upsert: true, new: true }
    );
    tasks.push(task);
  }

  if (tasks.length && order.user?.email) {
    const linkMarkup = tasks
      .map((task) => {
        const productTitle = task.product?.title || 'Deliverable';
        const items = task.downloadLinks
          .map((link) => `<li><a href="${link.url}">${link.url}</a> (expires ${link.expiresAt.toISOString()})</li>`)
          .join('');
        return `<h3>${productTitle}</h3><ul>${items}</ul>`;
      })
      .join('');

    await sendFulfilmentEmail({
      to: order.user.email,
      subject: `Builtattic deliverables for order ${order._id}`,
      text: `Your deliverables are ready. Visit your dashboard to download them.`,
      html: `<p>Your deliverables are ready. Download links (valid for 10 minutes):</p>${linkMarkup}`,
    });
  }

  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        'fulfilment.status': 'delivered',
        'fulfilment.deliveredAt': new Date(),
      },
    }
  );

  return tasks;
}

