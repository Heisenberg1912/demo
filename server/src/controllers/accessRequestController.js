import AccessRequest, { ACCESS_ROLE_OPTIONS } from '../models/AccessRequest.js';

export const createAccessRequest = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      country,
      role,
      isContributor,
      secretCode,
    } = req.body || {};

    if (!name || !email || !phone || !city || !country || !role || !secretCode) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!ACCESS_ROLE_OPTIONS.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city: city.trim(),
      country: country.trim(),
      role,
      isContributor: Boolean(isContributor),
      secretCode: secretCode.trim(),
      meta: {
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
      },
    };

    const entry = await AccessRequest.create(payload);
    return res.status(201).json({ success: true, id: entry._id });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to save access request.' });
  }
};
