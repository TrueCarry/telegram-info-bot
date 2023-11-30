const dotenv = require('dotenv')
const { Telegraf } = require('telegraf')
const axios = require('axios')

dotenv.config()

const defaultDescription = process.env.DESCRIPTION.replace(/\\n/g, '\n')

const channelId = process.env.CHANNEL_ID

const USDTAddress = 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA'
const PTONAddress = 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez'
const FNZAddress = 'EQDCJL0iQHofcBBvFBHdVG233Ri2V4kCNFgfRT-gqAd3Oc86'
const GLINTAddress = 'EQCBdxpECfEPH2wUxi1a6QiOkSf-5qDjUWqLCUuKtD-GLINT'

const bot = new Telegraf(process.env.BOT_TOKEN)

async function main() {
    setInterval(async () => {
        updateDescription()
    }, 120000)
    updateDescription()
}
main()

async function updateDescription() {
    try {
        const { data: tonFnz } = await axios.post(`https://api.ston.fi/v1/swap/simulate`, {}, {
            params: {
                offer_address: FNZAddress,
                ask_address: PTONAddress,
                units: 1000000000,
                slippage_tolerance: 0.001,
            }
        })
        const { data: tonGlint } = await axios.post(`https://api.ston.fi/v1/swap/simulate`, {}, {
            params: {
                offer_address: GLINTAddress,
                ask_address: PTONAddress,
                units: 1000000000,
                slippage_tolerance: 0.001,
            }
        })
        const { data: tonUsdt } = await axios.post(`https://api.ston.fi/v1/swap/simulate`, {}, {
            params: {
                offer_address: USDTAddress,
                ask_address: PTONAddress,
                units: 1000000000,
                slippage_tolerance: 0.001,
            }
        })

        const fnzTonPrice = tonFnz.swap_rate
        const glintTonPrice = tonGlint.swap_rate
        const usdTonPrice = tonUsdt.swap_rate

        const fnzUsdPrice = 1 / parseFloat(usdTonPrice) * parseFloat(fnzTonPrice)
        const glintUsdPrice = 1 / parseFloat(usdTonPrice) * parseFloat(glintTonPrice)

        const newDescription = `🔥 ≈ ${formatNumber(fnzTonPrice)}💎 (${formatNumber(fnzUsdPrice, 1)}$)
✨ ≈ ${formatNumber(glintTonPrice)}💎 (${formatNumber(glintUsdPrice, 1)}$)
\n${defaultDescription}`
        await bot.telegram.setChatDescription(channelId, newDescription)
        console.log('updated description', new Date())
    } catch (e) {
        if (e?.message?.includes('Bad Request: chat description is not modified')) {
            return
        }

        console.error(e)
    }
}

function formatNumber(n, digits = 2) {
    const num = parseFloat(n)
    const digitsCount = Math.abs(Math.floor(Math.log10(n))) // 0.02 -> -2

    return num.toFixed(digitsCount + digits)
}
