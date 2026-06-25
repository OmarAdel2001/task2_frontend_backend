export interface ThreatIndicator {
  type: 'danger' | 'warning' | 'safe';
  message: string;
}

export interface ScanResult {
  score: number; // 0 to 100 (100 is most secure, 0 is dangerous)
  level: 'Safe' | 'Suspicious' | 'Dangerous';
  indicators: ThreatIndicator[];
}

export interface QuizQuestion {
  id: number;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  isPhishing: boolean;
  hoverUrl?: string; // The URL that displays on link hover
  explanation: string;
}

// Heuristic Threat Scanner
export const analyzeContent = (content: string): ScanResult => {
  const indicators: ThreatIndicator[] = [];
  let score = 100;
  
  if (!content || content.trim().length < 5) {
    return {
      score: 100,
      level: 'Safe',
      indicators: [{ type: 'safe', message: 'No content analyzed. Input is empty or too short.' }]
    };
  }

  const normalized = content.toLowerCase();

  // 1. URL Analysis (if content looks like a URL or contains one)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];

  if (urls.length > 0) {
    indicators.push({ type: 'warning', message: `Found ${urls.length} link(s) in the analyzed content.` });
    
    urls.forEach(url => {
      // Check for HTTP instead of HTTPS
      if (url.startsWith('http://')) {
        score -= 20;
        indicators.push({ type: 'danger', message: `Insecure connection: Link "${url.substring(0, 40)}..." uses http instead of https.` });
      }

      // Check for suspicious words in domains
      const suspiciousDomainWords = ['verify', 'update', 'login', 'secure', 'account', 'signin', 'support', 'billing', 'banking', 'netflix', 'paypal', 'google', 'microsoft', 'amazon', 'apple'];
      suspiciousDomainWords.forEach(word => {
        if (url.includes(word) && !url.includes('paypal.com') && !url.includes('google.com') && !url.includes('microsoft.com') && !url.includes('amazon.com') && !url.includes('apple.com') && !url.includes('netflix.com')) {
          score -= 15;
          indicators.push({ type: 'danger', message: `Suspicious domain keyword: Link contains "${word}" which is commonly used to spoof domains.` });
        }
      });

      // Check for IP addresses instead of domains
      const ipRegex = /\/\/(\d{1,3}\.){3}\d{1,3}/;
      if (ipRegex.test(url)) {
        score -= 25;
        indicators.push({ type: 'danger', message: 'IP address used as link host. Legitimate organizations rarely use IP addresses directly.' });
      }

      // Check for long subdomains or dash usage
      const hostname = url.split('/')[2] || '';
      if (hostname.split('.').length > 4) {
        score -= 10;
        indicators.push({ type: 'warning', message: `Extremely long subdomain structure in "${hostname.substring(0, 30)}...". This is often used to hide the actual domain name.` });
      }
      if (hostname.includes('-') && hostname.split('.').some(part => part.includes('-'))) {
        score -= 5;
        indicators.push({ type: 'warning', message: 'Domain contains hyphens in subdomains, often a tactic to mimic official brands.' });
      }
    });
  }

  // 2. Text / Content Analysis (Urgency, Greetings, Bad Grammar)
  const urgentKeywords = ['urgent', 'immediate action', 'suspend', 'restricted', 'unauthorized', 'expire', 'security breach', 'verify your account', 'action required', 'reset password immediately', 'compromised'];
  let urgentCount = 0;
  urgentKeywords.forEach(keyword => {
    if (normalized.includes(keyword)) {
      urgentCount++;
      score -= 10;
    }
  });
  if (urgentCount > 0) {
    indicators.push({ 
      type: 'danger', 
      message: `High urgency language: Found ${urgentCount} phishing-related pressure words (e.g. urgent, suspended, verify).` 
    });
  }

  // Generic greetings
  const genericGreetings = ['dear customer', 'dear user', 'valued customer', 'undisclosed-recipients', 'hello user'];
  let genericFound = false;
  genericGreetings.forEach(greeting => {
    if (normalized.includes(greeting)) {
      genericFound = true;
      score -= 10;
    }
  });
  if (genericFound) {
    indicators.push({ type: 'warning', message: 'Generic greeting detected: Phishing emails often use generic greetings instead of your name.' });
  }

  // Financial request trigger
  const financialTriggers = ['bank transfer', 'wire transfer', 'routing number', 'credit card details', 'social security', 'gift card', 'bitcoin', 'cryptocurrency', 'tax refund', 'invoice payment'];
  let financeCount = 0;
  financialTriggers.forEach(trigger => {
    if (normalized.includes(trigger)) {
      financeCount++;
      score -= 15;
    }
  });
  if (financeCount > 0) {
    indicators.push({ type: 'danger', message: 'Financial/Identity trigger: Content requests sensitive information, transfers, or banking details.' });
  }

  // Guarantee score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine threat level
  let level: 'Safe' | 'Suspicious' | 'Dangerous' = 'Safe';
  if (score < 50) {
    level = 'Dangerous';
  } else if (score < 85) {
    level = 'Suspicious';
  }

  // If no negative indicators, add a positive one
  if (indicators.length === 0) {
    indicators.push({ type: 'safe', message: 'No suspicious keywords, insecure URLs, or phishing patterns detected. This content appears normal.' });
  } else if (score >= 85) {
    indicators.push({ type: 'safe', message: 'Basic security structures are intact, though minor precautions are recommended.' });
  }

  return { score, level, indicators };
};

// Preset scans for users to quickly test the analyzer
export const SCANNER_PRESETS = [
  {
    id: 'paypal',
    name: 'Suspicious Paypal Alert',
    content: `Subject: URGENT: Your PayPal Account Has Been Restricted!

Dear Customer,

We detected unauthorized login attempts to your PayPal account from a device in Russia. For your safety, we have temporarily restricted your access.

You must verify your identity immediately to restore your account. Please click the secure link below to update your billing information:

http://verify-paypal-secure-support.com/signin

If you do not complete this verification within 24 hours, your account will be permanently suspended.

Thank you,
PayPal Security Team`
  },
  {
    id: 'hr',
    name: 'Fake HR Policy Update',
    content: `Subject: Mandatory Employee Benefits Update - Action Required

Hi Team,

Please review the revised 2026 Employee Health Benefits Package policy update. All employees are required to sign the updated agreement by Friday.

Access the portal and register your sign-off here:
https://portal-benefits-update.internal-hr-dashboard.net/login

Failure to register by the deadline may affect your next payroll cycle.

Regards,
Human Resources`
  },
  {
    id: 'meeting',
    name: 'Legitimate Calendar Invite',
    content: `Subject: Weekly Design Review

Hi everyone,

Just a reminder that our weekly design review is scheduled for tomorrow at 10:00 AM in Conference Room B. 

We will be reviewing the new onboarding flow prototypes. If you have any feedback to present, please add a link to the agenda document:

https://docs.google.com/document/d/1A_B3C9dE_meeting_agenda/edit

See you all tomorrow!

Best,
Sarah Miller
Lead Product Designer`
  }
];

// Quiz Questions Bank
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    sender: 'Netflix Security',
    senderEmail: 'support@netflix-billing-update.com',
    subject: 'Action Required: Update your payment method',
    body: 'Dear customer, your membership could not be renewed because there is an issue with your current billing details. To prevent service interruption, please update your payment method by clicking the button below:\n\n[UPDATE MY MEMBERSHIP]\n\nIf you do not update your details within 48 hours, your account will be closed.',
    isPhishing: true,
    hoverUrl: 'http://netflix.account-billing-login-portal.info/update',
    explanation: 'This is PHISHING. Note the sender email domain ("netflix-billing-update.com" instead of "netflix.com") and the link URL which redirects to a suspicious .info domain. Additionally, it uses urgent language ("prevent service interruption") and generic greetings ("Dear customer").'
  },
  {
    id: 2,
    sender: 'GitHub Security',
    senderEmail: 'noreply@github.com',
    subject: '[GitHub] Security Alert: New SSH key added',
    body: 'Hi omar-adel,\n\nThe following SSH key was recently added to your account:\n\nSHA256:u1vWXY90zAB/CdeFGhijKLMNoPqRsTuvwxyZaBCdeFG\n\nIf you added this key, you can safely ignore this email. If you did not recognize it, please visit your settings to remove it and secure your account immediately.',
    isPhishing: false,
    hoverUrl: 'https://github.com/settings/keys',
    explanation: 'This email is LEGITIMATE. The sender is "noreply@github.com" which is a valid GitHub domain. The destination link goes directly to "github.com". It addresses the user by their username ("omar-adel") and does not demand immediate password changes or financial information.'
  },
  {
    id: 3,
    sender: 'DHL Express Delivery',
    senderEmail: 'delivery-agent-402@dhl-delivery-status.net',
    subject: 'Package Delivery Pending - Address Verification Required',
    body: 'Your package with tracking number DHL-8490-9382 could not be delivered due to an incorrect street address. \n\nA shipping fee of $1.50 is pending to reschedule. Please verify your address and complete the payment online:\n\n[RESCHEDULE PACKAGE DELIVERY]\n\nPlease note: Packages will be returned to the sender after 3 business days.',
    isPhishing: true,
    hoverUrl: 'http://192.168.45.2/dhl/checkout.php',
    explanation: 'This is PHISHING. Attackers frequently mimic delivery companies like DHL, FedEx, or USPS. The sender email domain is suspicious ("dhl-delivery-status.net" instead of "dhl.com"). More importantly, the link points directly to a local/private IP address (192.168.45.2) instead of a secure DHL domain.'
  },
  {
    id: 4,
    sender: 'Google Workspace',
    senderEmail: 'no-reply@accounts.google.com',
    subject: 'Security Alert: New sign-in detected on Linux',
    body: 'We noticed a new sign-in to your Google Account on a Linux device from Cairo, Egypt.\n\nIf this was you, you don\'t need to do anything. If you don\'t recognize this activity, we can help you secure your account.\n\n[CHECK ACTIVITY]',
    isPhishing: false,
    hoverUrl: 'https://myaccount.google.com/notifications',
    explanation: 'This email is LEGITIMATE. The sender address "no-reply@accounts.google.com" is Google\'s official domain. The link resolves to a valid sub-domain of Google ("myaccount.google.com"). It is a standard automated security notification.'
  },
  {
    id: 5,
    sender: 'Microsoft Accounts Department',
    senderEmail: 'support-office-365@secure-microsoft-verify.org',
    subject: 'ALERT: Password expiration in 24 hours',
    body: 'Dear Microsoft Office 365 Client,\n\nYour Office 365 account password will expire in 24 hours. To retain your current password and avoid losing access to your inbox, please verify your credentials immediately.\n\n[KEEP MY CURRENT PASSWORD]\n\nThank you,\nMicrosoft User Services',
    isPhishing: true,
    hoverUrl: 'https://login.microsoftonline.com.secure-sign-in.tk/oauth',
    explanation: 'This is PHISHING. Microsoft will never email you to "retain your current password". The sender email ("secure-microsoft-verify.org") and the target link contain brand terms but point to a free ".tk" subdomain ("secure-sign-in.tk") designed to look like Microsoft online portal.'
  }
];
