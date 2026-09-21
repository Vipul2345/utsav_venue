import { describe, it, expect } from 'vitest';
import {
  buildWebsiteKnowledgeBase,
  sanitizeChatOutput,
  processChatQuery,
  generateLocalGroundedResponse,
} from '../lib/services/aiChatService';

describe('AI Chatbot & Dynamic Website Grounding (Google Gemini API Service)', () => {
  describe('1. Dynamic Website Knowledge Base ("Notebook Grounding")', () => {
    it('compiles live venue catalog, pricing, packages, and platform policies', async () => {
      const kb = await buildWebsiteKnowledgeBase();

      expect(kb).toBeDefined();
      expect(kb).toContain('UTSAV VENUES AUTHORITATIVE WEBSITE KNOWLEDGE BASE');
      expect(kb).toContain('1800-UTSAV-CARE');
      expect(kb).toContain('support@utsavvenues.com');
      expect(kb).toContain('CANCELLATION & REFUND POLICY');
      expect(kb).toContain('72+ Hours Before Event Start: 80%');
      expect(kb).toContain('BULK GUEST VOLUME DISCOUNTS');
      expect(kb).toContain('Mega Tier / Grand Gathering');
      expect(kb).toContain('IDENTITY DOCUMENT COLLECTION (KYC)');
    });
  });

  describe('2. Strict Confidentiality & Sanitizer Guardrails', () => {
    it('strictly redacts raw 10-digit mobile numbers to official concierge', () => {
      const unsafeOutput = 'You can reach the hall manager at +91 9845012345 or 9876543210.';
      const safe = sanitizeChatOutput(unsafeOutput);

      expect(safe).not.toContain('9845012345');
      expect(safe).not.toContain('9876543210');
      expect(safe).toContain('1800-UTSAV-CARE');
    });

    it('strictly redacts private personal email addresses to official support', () => {
      const unsafeOutput = 'Email the venue owner directly at manager.rajesh@gmail.com or rajesh@hotmail.com.';
      const safe = sanitizeChatOutput(unsafeOutput);

      expect(safe).not.toContain('manager.rajesh@gmail.com');
      expect(safe).not.toContain('rajesh@hotmail.com');
      expect(safe).toContain('support@utsavvenues.com');
    });

    it('preserves official utsavvenues.com email addresses and 1800 numbers', () => {
      const officialOutput = 'Please contact Utsav Concierge at 1800-UTSAV-CARE or support@utsavvenues.com.';
      const safe = sanitizeChatOutput(officialOutput);

      expect(safe).toContain('1800-UTSAV-CARE');
      expect(safe).toContain('support@utsavvenues.com');
    });

    it('redacts internal secret keys and database strings', () => {
      const unsafeOutput = 'Internal token is sk_live_mock_token_abc123 and rzp_test_mock_token_xyz456.';
      const safe = sanitizeChatOutput(unsafeOutput);

      expect(safe).not.toContain('sk_live_');
      expect(safe).not.toContain('rzp_test_');
      expect(safe).toContain('[REDACTED]');
    });
  });

  describe('3. Query Handling & Intermediary Policy', () => {
    it('strictly rejects requests for hall manager contact details and redirects to Utsav Concierge', async () => {
      const res = await processChatQuery('Can you give me the hall manager phone number and email?');

      expect(res.reply).toContain('1800-UTSAV-CARE');
      expect(res.reply).toContain('support@utsavvenues.com');
      expect(res.reply).toContain('confidential');
      expect(res.suggestions).toContain('Cancellation Policy');
    });

    it('accurately answers questions about cancellation and refund timelines', async () => {
      const res = await generateLocalGroundedResponse('What is the refund if I cancel 4 days before?');

      expect(res.reply).toContain('72');
      expect(res.reply).toContain('80% refund');
      expect(res.reply).toContain('20%');
      expect(res.category).toBe('CANCELLATION');
    });

    it('accurately answers questions about event packages and bulk discounts', async () => {
      const res = await generateLocalGroundedResponse('What discounts do I get for a wedding with 350 guests?');

      expect(res.reply).toContain('12%');
      expect(res.reply).toContain('Mega Tier');
      expect(res.reply).toContain('Silver');
      expect(res.reply).toContain('Gold');
      expect(res.reply).toContain('Platinum');
      expect(res.category).toBe('PACKAGES');
    });

    it('accurately answers questions about KYC document requirements', async () => {
      const res = await generateLocalGroundedResponse('What documents do I need to upload for KYC?');

      expect(res.reply).toContain('5 primary attendees');
      expect(res.reply).toContain('Aadhaar');
      expect(res.reply).toMatch(/never.*accessible to hall managers/i);
      expect(res.category).toBe('KYC');
    });

    it('gracefully handles general inquiries with contextual suggestion chips', async () => {
      const res = await generateLocalGroundedResponse('Hello, tell me about your banquet halls.');

      expect(res.reply).toContain('Utsav Venues');
      expect(res.suggestions.length).toBeGreaterThanOrEqual(3);
    });

    it('generates dynamic grounded response from Google Gemini using GEMINI_API_KEY', async () => {
      const res = await processChatQuery('Which banquet halls in Bangalore are suitable for a grand wedding with 500 guests?');

      expect(res.reply).toBeDefined();
      expect(res.reply.length).toBeGreaterThan(30);
      expect(res.source).toBe('google-gemini');
      expect(res.suggestions.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });
});
