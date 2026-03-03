# Setup Local AWS Credentials

## Why This?

You want to use different AWS credentials for this project without affecting your global AWS configuration.

## Step-by-Step

### Step 1: Get Your AWS Credentials

1. Log in to your AWS Console: https://console.aws.amazon.com
2. Click your username (top right) → **Security credentials**
3. Scroll to **Access keys**
4. Click **Create access key**
5. Select **Command Line Interface (CLI)**
6. Click **Next** → **Create access key**
7. **Copy** or **Download** the credentials:
   - Access Key ID (starts with AKIA...)
   - Secret Access Key (long random string)

### Step 2: Configure Local Credentials

Run this script:

```bash
./configure-aws-local.sh
```

It will ask for:
- **AWS Access Key ID**: Paste the key from Step 1
- **AWS Secret Access Key**: Paste the secret from Step 1
- **AWS Region**: Press Enter for default (us-east-1)

### Step 3: Verify

The script will automatically test your credentials and show:

```
✅ Credentials verified!
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/youruser"
}
```

Make sure the **Account** number is the one you want to use!

### Step 4: Deploy

Now you can deploy:

```bash
./deploy-backend-and-web.sh
```

The deployment will automatically use your local credentials.

---

## How It Works

### Local Credentials Storage

Your credentials are stored in:
```
.aws/
├── credentials  (Access keys)
├── config       (Region settings)
└── env.sh       (Environment variables)
```

These files are:
- ✅ Local to this repository only
- ✅ Automatically added to .gitignore
- ✅ Won't affect global AWS config
- ✅ Won't be committed to git

### Using Local Credentials

The deployment script automatically sources `.aws/env.sh` which sets:
```bash
export AWS_CONFIG_FILE="$(pwd)/.aws/config"
export AWS_SHARED_CREDENTIALS_FILE="$(pwd)/.aws/credentials"
```

This tells AWS CLI to use local credentials instead of global ones.

---

## Manual Usage

If you want to use local credentials for other AWS commands:

```bash
# Source the environment file
source .aws/env.sh

# Now run any AWS command
aws s3 ls
aws lambda list-functions
```

---

## Switching Back to Global Credentials

Just open a new terminal window, or run:

```bash
unset AWS_CONFIG_FILE
unset AWS_SHARED_CREDENTIALS_FILE
```

---

## Troubleshooting

### "Credentials verification failed"

- Double-check your Access Key ID and Secret Access Key
- Make sure you copied them correctly (no extra spaces)
- Verify the IAM user has necessary permissions

### "Permission denied"

```bash
chmod +x configure-aws-local.sh
```

### Want to reconfigure?

Just run the script again:
```bash
./configure-aws-local.sh
```

It will overwrite the old credentials.

---

## Security Notes

✅ **Safe:**
- Credentials stored locally only
- Added to .gitignore automatically
- Won't be committed to git
- Won't affect other projects

⚠️ **Important:**
- Never commit `.aws/` directory
- Never share your credentials
- Use IAM users with minimal permissions
- Rotate keys regularly

---

## Ready?

Run:
```bash
./configure-aws-local.sh
```

Then deploy:
```bash
./deploy-backend-and-web.sh
```

