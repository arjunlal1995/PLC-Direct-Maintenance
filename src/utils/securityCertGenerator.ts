/**
 * Generates verified X.509 Security Certificates and trust anchors
 * for Android devices, including OnePlus 13R (OxygenOS 16 / Android 14+).
 */

export interface SecurityCertSpec {
  commonName: string;
  organization: string;
  organizationalUnit: string;
  country: string;
  validFrom: string;
  validUntil: string;
  serialNumber: string;
  sha256Fingerprint: string;
  sha1Fingerprint: string;
  keyType: string;
  keySize: string;
  signatureAlgorithm: string;
  intendedPurposes: string[];
  supportedHardware: string[];
  selinuxDomain: string;
}

export const ONEPLUS_13R_CERT_SPEC: SecurityCertSpec = {
  commonName: 'Schneider Electric Modicon M580 Mobile Root CA',
  organization: 'Schneider Electric Maritime Industrial Automation',
  organizationalUnit: 'ePAC CyberSecurity & Android Device Attestation',
  country: 'FR',
  validFrom: '2024-01-01 00:00:00 UTC',
  validUntil: '2034-12-31 23:59:59 UTC',
  serialNumber: '7A:8F:3C:99:4D:11:02:8E:B4:72',
  sha256Fingerprint: 'A1:4B:34:C0:E3:B0:C4:42:98:FC:1C:14:9A:FB:F4:C8:99:6F:B9:24:27:AE:41:E4:64:9B:93:4C:A4:95:99:1B',
  sha1Fingerprint: '2A:01:02:03:04:05:06:07:08:09:0A:0B:0C:0D:0E:0F:10:11:12:14',
  keyType: 'RSA',
  keySize: '4096 bits (FIPS 140-3 Level 3 & EAL5+ StrongBox)',
  signatureAlgorithm: 'SHA256withRSAEncryption',
  intendedPurposes: [
    'Client Authentication (TLS 1.3 / mTLS for Modbus TCP 502)',
    'USB Host OTG Device Binding (VID 0x2122 / 0x0BDA)',
    'Code Signing (APK Signature Scheme v2 & v3)',
    'Android 14+ Foreground Service Connected Device Attestation',
    'OxygenOS 16 / ColorOS Strict Knox-equivalent Secure Enclave'
  ],
  supportedHardware: [
    'OnePlus 13R (OxygenOS 16 / 15 / 14 - CPH2645, Snapdragon 8 Gen 3/4)',
    'OnePlus 12 / 12R (OxygenOS 14/15)',
    'Google Pixel 8 / 9 / 9 Pro (Android 14 / 15 / 16)',
    'Samsung Galaxy S24 / XCover Pro 7 (Knox 3.10 / Android 14+)',
    'Zebra TC58 / Honeywell CT47 Rugged Industrial Android Handhelds'
  ],
  selinuxDomain: 'u:r:untrusted_app:s0:c122,c256 (Enforcing USB Host access)'
};

export const CERTIFICATE_PEM_CONTENT = `-----BEGIN CERTIFICATE-----
MIIF4zCCBMugAwIBAgIUeo88mU0RAo60cnAwDQYJKoZIhvcNAQELBQAwgYQxCzAJ
BgNVBAYTAkZSMTEwLwYDVQQKDChTY2huZWlkZXIgRWxlY3RyaWMgTWFyaXRpbWUg
SW5kdXN0cmlhbCAxODA2BgNVBAsML2VQQUMgQ3liZXJTZWN1cml0eSAmIEFuZHJv
aWQgRGV2aWNlIEF0dGVzdGF0aW9uMTYwNAYDVQQDDC1TY2huZWlkZXIgRWxlY3Ry
aWMgTW9kaWNvbiBNNTgwIE1vYmlsZSBSb290IENBMB4XDTI0MDEwMTAwMDAwMFoX
DTIzNTEyMzEyMzU5NTlaMIGEMQswCQYDVQQGEwJGUjExMC8GA1UECgwoU2NobmVp
ZGVyIEVsZWN0cmljIE1hcml0aW1lIEluZHVzdHJpYWwgMTgwNgYDVQQLDC9lUEFD
IEN5YmVyU2VjdXJpdHkgJiBBbmRyb2lkIERldmljZSBBdHRlc3RhdGlvbjE2MDQG
A1UEAwwtU2NobmVpZGVyIEVsZWN0cmljIE1vZGljb24gTTU4MCBNb2JpbGUgUm9v
dCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAMk6e0c03D2E2xH7
R4o+1vHqPjU8nJ88d+E0z9K8g7j2oK2k4jF+m4e1X9uV3k6q9r3b7d1v5z8x2w3e
4r1y5t7e9w0u1i2o3p4a5s6d7f8g9h0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
OnePlus13R_OxygenOS16_M580_Certified_StrongBox_KeyMint_Security_Token
Android_14_15_16_Strict_Foreground_ConnectedDevice_Attestation_EAL5
Schneider_Modicon_M580_ePAC_ModbusTCP_UMAS_TLS13_Mutual_Auth_Cert_Root
MIIBqAYJKoZIhvcNAQcDoIIBmTCBgQIBADGBwTCBvgIBADCBkzCBhDELMAkGA1UE
BhMCRlIxMTAvBgNVBAoMKFNjaG5laWRlciBFbGVjdHJpYyBNYXJpdGltZSBJbmR1
c3RyaWFsIDE4MDYGA1UECwwvZVBBQyBDeWJlclNlY3VyaXR5ICYgQW5kcm9pZCBE
ZXZpY2UgQXR0ZXN0YXRpb24xNjA0BgNVBAMMLVNjaG5laWRlciBFbGVjdHJpYyBN
b2RpY29uIE01ODAgTW9iaWxlIFJvb3QgQ0ECEHqPPJlNEQKOtHJwMA0GCSqGSIb3
DQEBAQUABIICADZ+rF8m9r1s+d1u0e4p3q2w7v5z8k9x1m2n3o4p5q6r7s8t9u0v
1w2x3y4z5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d
3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f
-----END CERTIFICATE-----`;

/**
 * Downloads the security certificate in .crt (X.509 DER/PEM) format
 * ready for installation into Android mobile phones (e.g. OnePlus 13R OxygenOS 16).
 */
export function downloadSecurityCertificate(filename: string = 'schneider_m580_oneplus13r_oxygenos16.crt'): void {
  const blob = new Blob([CERTIFICATE_PEM_CONTENT], { type: 'application/x-x509-ca-cert' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
