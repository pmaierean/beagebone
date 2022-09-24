/**
 * This is the ADC1115 converter
 */
const i2c = require('i2c-bus');

const I2C_0 = 0;
const I2C_1 = 1;
const I2C_2 = 2;

const I2CDEV_DEFAULT_READ_TIMEOUT = 1000;
const ADS1115_ADDRESS_ADDR_GND = 0x48; // address pin low (GND)
const ADS1115_ADDRESS_ADDR_VDD = 0x49; // address pin high (VCC)
const ADS1115_ADDRESS_ADDR_SDA = 0x4A; // address pin tied to SDA pin
const ADS1115_ADDRESS_ADDR_SCL = 0x4B; // address pin tied to SCL pin
const ADS1115_DEFAULT_ADDRESS = ADS1115_ADDRESS_ADDR_GND;

const ADS1115_RA_CONVERSION = 0x00;
const ADS1115_RA_CONFIG = 0x01;
const ADS1115_RA_LO_THRESH =0x02;
const ADS1115_RA_HI_THRESH =0x03;

const ADS1115_CFG_OS_BIT = 15;
const ADS1115_CFG_MUX_BIT = 14;
const ADS1115_CFG_MUX_LENGTH = 3;
const ADS1115_CFG_PGA_BIT = 11;
const ADS1115_CFG_PGA_LENGTH = 3;
const ADS1115_CFG_MODE_BIT =8;
const ADS1115_CFG_DR_BIT = 7;
const ADS1115_CFG_DR_LENGTH = 3;
const ADS1115_CFG_COMP_MODE_BIT = 4;
const ADS1115_CFG_COMP_POL_BIT = 3;
const ADS1115_CFG_COMP_LAT_BIT = 2;
const ADS1115_CFG_COMP_QUE_BIT = 1;
const ADS1115_CFG_COMP_QUE_LENGTH = 2;

const ADS1115_MUX_P0_N1 = 0x00; // default
const ADS1115_MUX_P0_N3 = 0x01;
const ADS1115_MUX_P1_N3 = 0x02;
const ADS1115_MUX_P2_N3 = 0x03;
const ADS1115_MUX_P0_NG = 0x04;
const ADS1115_MUX_P1_NG = 0x05;
const ADS1115_MUX_P2_NG = 0x06;
const ADS1115_MUX_P3_NG = 0x07;

const ADS1115_PGA_6P144 = 0x00;
const ADS1115_PGA_4P096 = 0x01;
const ADS1115_PGA_2P048 = 0x02;// default
const ADS1115_PGA_1P024 = 0x03;
const ADS1115_PGA_0P512 = 0x04;
const ADS1115_PGA_0P256 = 0x05;
const ADS1115_PGA_0P256B = 0x06;
const ADS1115_PGA_0P256C = 0x07;

const ADS1115_MV_6P144 = 0.187500;
const ADS1115_MV_4P096 = 0.125000;
const ADS1115_MV_2P048 = 0.062500; // default
const ADS1115_MV_1P024 = 0.031250;
const ADS1115_MV_0P512 = 0.015625;
const ADS1115_MV_0P256 = 0.007813;
const ADS1115_MV_0P256B = 0.007813;
const ADS1115_MV_0P256C = 0.007813;

const ADS1115_MODE_CONTINUOUS = 0x00;
const ADS1115_MODE_SINGLESHOT = 0x01; // default

const ADS1115_RATE_8 = 0x00;
const ADS1115_RATE_16 = 0x01;
const ADS1115_RATE_32 = 0x02;
const ADS1115_RATE_64 = 0x03;
const ADS1115_RATE_128 = 0x04; // default
const ADS1115_RATE_250 = 0x05;
const ADS1115_RATE_475 = 0x06;
const ADS1115_RATE_860 = 0x07;

const ADS1115_COMP_MODE_HYSTERESIS = 0x00; // default
const ADS1115_COMP_MODE_WINDOW = 0x01;

const ADS1115_COMP_POL_ACTIVE_LOW = 0x00; // default
const ADS1115_COMP_POL_ACTIVE_HIGH = 0x01;

const ADS1115_COMP_LAT_NON_LATCHING = 0x00; // default
const ADS1115_COMP_LAT_LATCHING = 0x01;

const ADS1115_COMP_QUE_ASSERT1 = 0x00;
const ADS1115_COMP_QUE_ASSERT2 = 0x01;
const ADS1115_COMP_QUE_ASSERT4 = 0x02;
const ADS1115_COMP_QUE_DISABLE = 0x03; // default

const O_RDONLY = 0x00;
const O_WRONLY = 0x01;
const O_RDWR = 0x02

function ads1115() {
    var devAddr;
    var devMode = false;
    var muxMode;
    var pgaMode;
    var i2cChannel = I2C_1;

    /** Power on and prepare for general usage.
     * This device is ready to use automatically upon power-up. It defaults to
     * single-shot read mode, P0/N1 mux, 2.048v gain, 128 samples/sec, default
     * comparator with hysterysis, active-low polarity, non-latching comparator,
     * and comparater-disabled operation.
     */
    this.initialize = function(addr) {
        if (isNaN(addr)) {
            this.devAddr = ADS1115_DEFAULT_ADDRESS;
        }
        else {
            this.devAddr = addr;
        }
        this.setMultiplexer(ADS1115_MUX_P0_N1);
        this.setGain(ADS1115_PGA_2P048);
        this.setMode(ADS1115_MODE_SINGLESHOT);
        this.setRate(ADS1115_RATE_128);
        this.setComparatorMode(ADS1115_COMP_MODE_HYSTERESIS);
        this.setComparatorPolarity(ADS1115_COMP_POL_ACTIVE_LOW);
        this.setComparatorLatchEnabled(ADS1115_COMP_LAT_NON_LATCHING);
        this.setComparatorQueueMode(ADS1115_COMP_QUE_DISABLE);
    };

    /** Verify the I2C connection.
     * Make sure the device is connected and responds as expected.
     * @return True if connection is valid, false otherwise
     */
    this.testConnection = function() {
        var buf = new Array(1);
        return this.readBytes(ADS1115_RA_CONVERSION, 1, buf) == 1;
    };

    /** Poll the operational status bit until the conversion is finished
     * Retry at most 'max_retries' times
     * conversion is finished, then return true;
     * @see ADS1115_CFG_OS_BIT
     * @return True if data is available, false otherwise
     */
    this.pollConversion = function(max_retries) {
        for (var i = 0; i < max_retries; i++) {
            if (this.isConversionReady()) {
                return true;
            }
        }
        return false;
    };

    /** Read differential value based on current MUX configuration.
     * The default MUX setting sets the device to get the differential between the
     * AIN0 and AIN1 pins. There are 8 possible MUX settings, but if you are using
     * all four input pins as single-end voltage sensors, then the default option is
     * not what you want; instead you will need to set the MUX to compare the
     * desired AIN* pin with GND. There are shortcut methods (getConversion*) to do
     * this conveniently, but you can also do it manually with setMultiplexer()
     * followed by this method.
     *
     * In single-shot mode, this register may not have fresh data. You need to write
     * a 1 bit to the MSB of the CONFIG register to trigger a single read/conversion
     * before this will be populated with fresh data. This technique is not as
     * effortless, but it has enormous potential to save power by only running the
     * comparison circuitry when needed.
     *
     * @param triggerAndPoll If true (and only in singleshot mode) the conversion trigger
     *        will be executed and the conversion results will be polled.
     * @return 16-bit signed differential value
     * @see getConversionP0N1();
     * @see getConversionPON3();
     * @see getConversionP1N3();
     * @see getConversionP2N3();
     * @see getConversionP0GND();
     * @see getConversionP1GND();
     * @see getConversionP2GND();
     * @see getConversionP3GND);
     * @see setMultiplexer();
     * @see ADS1115_RA_CONVERSION
     * @see ADS1115_MUX_P0_N1
     * @see ADS1115_MUX_P0_N3
     * @see ADS1115_MUX_P1_N3
     * @see ADS1115_MUX_P2_N3
     * @see ADS1115_MUX_P0_NG
     * @see ADS1115_MUX_P1_NG
     * @see ADS1115_MUX_P2_NG
     * @see ADS1115_MUX_P3_NG
     */
    this.getConversion = function(triggerAndPoll) {
        if (triggerAndPoll && this.devMode == ADS1115_MODE_SINGLESHOT) {
            this.triggerConversion();
            this.pollConversion(I2CDEV_DEFAULT_READ_TIMEOUT);
        }
        var buf = new Array(2);
        this.readWords(ADS1115_RA_CONVERSION, 2, buf);
        return buf[0];
    };

    /** Get AIN0/N1 differential.
     * This changes the MUX setting to AIN0/N1 if necessary, triggers a new
     * measurement (also only if necessary), then gets the differential value
     * currently in the CONVERSION register.
     * @return 16-bit signed differential value
     * @see getConversion()
     */
    this.getConversionP0N1 = function() {
        if (this.muxMode != ADS1115_MUX_P0_N1)
            this.setMultiplexer(ADS1115_MUX_P0_N1);
        return this.getConversion();
    };

    /** Get AIN0/N3 differential.
     * This changes the MUX setting to AIN0/N3 if necessary, triggers a new
     * measurement (also only if necessary), then gets the differential value
     * currently in the CONVERSION register.
     * @return 16-bit signed differential value
     * @see getConversion()
     */
    this.getConversionP0N3 = function() {
        if (this.muxMode != ADS1115_MUX_P0_N3)
            this.setMultiplexer(ADS1115_MUX_P0_N3);
        return this.getConversion();
    };

    /** Get AIN1/N3 differential.
     * This changes the MUX setting to AIN1/N3 if necessary, triggers a new
     * measurement (also only if necessary), then gets the differential value
     * currently in the CONVERSION register.
     * @return 16-bit signed differential value
     * @see getConversion()
     */
    this.getConversionP1N3 = function() {
        if (this.muxMode != ADS1115_MUX_P1_N3)
            this.setMultiplexer(ADS1115_MUX_P1_N3);
        return this.getConversion();
    };

    /** Get AIN2/N3 differential.
     * This changes the MUX setting to AIN2/N3 if necessary, triggers a new
     * measurement (also only if necessary), then gets the differential value
     * currently in the CONVERSION register.
     * @return 16-bit signed differential value
     * @see getConversion()
     */
    this.getConversionP2N3 = function() {
        if (this.muxMode != ADS1115_MUX_P2_N3)
            this.setMultiplexer(ADS1115_MUX_P2_N3);
        return this.getConversion();
    };

    /** Get AIN0/GND differential.
     * This changes the MUX setting to AIN0/GND if necessary, triggers a new
     * measurement (also only if necessary), then gets the differential value
     * currently in the CONVERSION register.
     * @return 16-bit signed differential value
     * @see getConversion()
     */
    this.getConversionP0GND = function() {
        if (this.muxMode != ADS1115_MUX_P0_NG)
            this.setMultiplexer(ADS1115_MUX_P0_NG);
        return this.getConversion();
    };

    /** Get AIN1/GND differential.
     * This changes the MUX setting to AIN1/GND if necessary, triggers a new
     * measurement (also only if necessary), then gets the differential value
     * currently in the CONVERSION register.
     * @return 16-bit signed differential value
     * @see getConversion()
     */
    this.getConversionP1GND = function() {
        if (this.muxMode != ADS1115_MUX_P1_NG)
            this.setMultiplexer(ADS1115_MUX_P1_NG);
        return this.getConversion();
    };

    /** Get AIN2/GND differential.
     * This changes the MUX setting to AIN2/GND if necessary, triggers a new
     * measurement (also only if necessary), then gets the differential value
     * currently in the CONVERSION register.
     * @return 16-bit signed differential value
     * @see getConversion()
     */
    this.getConversionP2GND = function() {
        if (this.muxMode != ADS1115_MUX_P2_NG)
            this.setMultiplexer(ADS1115_MUX_P2_NG);
        return this.getConversion();
    };

    /** Get AIN3/GND differential.
     * This changes the MUX setting to AIN3/GND if necessary, triggers a new
     * measurement (also only if necessary), then gets the differential value
     * currently in the CONVERSION register.
     * @return 16-bit signed differential value
     * @see getConversion()
     */
    this.getConversionP3GND = function() {
        if (this.muxMode != ADS1115_MUX_P3_NG)
            this.setMultiplexer(ADS1115_MUX_P3_NG);
        return this.getConversion();
    };

    /** Get the current voltage reading
     * Read the current differential and return it multiplied
     * by the constant for the current gain.  mV is returned to
     * increase the precision of the voltage
     * @param triggerAndPoll If true (and only in singleshot mode) the conversion trigger
     *        will be executed and the conversion results will be polled.
     */
    this.getMilliVolts = function(triggerAndPoll) {
        var ret = -1;
        switch (this.pgaMode) {
            case ADS1115_PGA_6P144:
                ret = (this.getConversion(triggerAndPoll) * ADS1115_MV_6P144);
                break;
            case ADS1115_PGA_4P096:
                ret = (this.getConversion(triggerAndPoll) * ADS1115_MV_4P096);
                break;
            case ADS1115_PGA_2P048:
                ret = (this.getConversion(triggerAndPoll) * ADS1115_MV_2P048);
                break;
            case ADS1115_PGA_1P024:
                ret = (this.getConversion(triggerAndPoll) * ADS1115_MV_1P024);
                break;
            case ADS1115_PGA_0P512:
                ret = (this.getConversion(triggerAndPoll) * ADS1115_MV_0P512);
                break;
            case ADS1115_PGA_0P256:
            case ADS1115_PGA_0P256B:
            case ADS1115_PGA_0P256C:
                ret = (this.getConversion(triggerAndPoll) * ADS1115_MV_0P256);
                break;
        }
        return ret;
    };

    /**
     * Return the current multiplier for the PGA setting.
     *
     * This may be directly retreived by using getMilliVolts(),
     * but this causes an independent read.  This function could
     * be used to average a number of reads from the getConversion()
     * getConversionx() functions and cut downon the number of
     * floating-point calculations needed.
     *
     */
    this.getMvPerCount = function() {
        var ret = -1.00;
        switch (this.pgaMode) {
            case ADS1115_PGA_6P144:
                ret = ADS1115_MV_6P144;
                break;
            case ADS1115_PGA_4P096:
                ret = ADS1115_MV_4P096;
                break;
            case ADS1115_PGA_2P048:
                ret = ADS1115_MV_2P048;
                break;
            case ADS1115_PGA_1P024:
                ret = ADS1115_MV_1P024;
                break;
            case ADS1115_PGA_0P512:
                ret = ADS1115_MV_0P512;
                break;
            case ADS1115_PGA_0P256:
            case ADS1115_PGA_0P256B:
            case ADS1115_PGA_0P256C:
                ret = ADS1115_MV_0P256;
                break;
        }
        return ret;
    };

    // CONFIG register

    /** Get operational status.
     * @return Current operational status (false for active conversion, true for inactive)
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_OS_BIT
     */
    this.isConversionReady = function() {
        var buf = new Array(1);
        this.readBitW(ADS1115_RA_CONFIG, ADS1115_CFG_OS_BIT, buf);
        return buf[0];
    };

    /** Trigger a new conversion.
     * Writing to this bit will only have effect while in power-down mode (no conversions active).
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_OS_BIT
     */
    this.triggerConversion = function() {
        this.writeBitW(ADS1115_RA_CONFIG, ADS1115_CFG_OS_BIT, 1);
    };

    /** Get multiplexer connection.
     * @return Current multiplexer connection setting
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_MUX_BIT
     * @see ADS1115_CFG_MUX_LENGTH
     */
    this.getMultiplexer = function() {
        var buf = new Array(ADS1115_CFG_MUX_LENGTH);
        this.readBitsW(ADS1115_RA_CONFIG, ADS1115_CFG_MUX_BIT, ADS1115_CFG_MUX_LENGTH, buf);
        this.muxMode = buf[0];
        return this.muxMode;
    };

    /** Set multiplexer connection.  Continous mode may fill the conversion register
     * with data before the MUX setting has taken effect.  A stop/start of the conversion
     * is done to reset the values.
     * @param mux New multiplexer connection setting
     * @see ADS1115_MUX_P0_N1
     * @see ADS1115_MUX_P0_N3
     * @see ADS1115_MUX_P1_N3
     * @see ADS1115_MUX_P2_N3
     * @see ADS1115_MUX_P0_NG
     * @see ADS1115_MUX_P1_NG
     * @see ADS1115_MUX_P2_NG
     * @see ADS1115_MUX_P3_NG
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_MUX_BIT
     * @see ADS1115_CFG_MUX_LENGTH
     */
    this.setMultiplexer = function(mux) {
        if (this.writeBitsW( ADS1115_RA_CONFIG, ADS1115_CFG_MUX_BIT, ADS1115_CFG_MUX_LENGTH, mux)) {
            this.muxMode = mux;
            if (this.devMode == ADS1115_MODE_CONTINUOUS) {
                // Force a stop/start
                this.setMode(ADS1115_MODE_SINGLESHOT);
                this.getConversion();
                this.setMode(ADS1115_MODE_CONTINUOUS);
            }
        }
    };

    /** Get programmable gain amplifier level.
     * @return Current programmable gain amplifier level
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_PGA_BIT
     * @see ADS1115_CFG_PGA_LENGTH
     */
    this.getGain = function() {
        var buffer = new Array(1);
        this.readBitsW(ADS1115_RA_CONFIG, ADS1115_CFG_PGA_BIT, ADS1115_CFG_PGA_LENGTH, buffer);
        this.pgaMode = buffer[0];
        return this.pgaMode;
    };

    /** Set programmable gain amplifier level.
     * Continous mode may fill the conversion register
     * with data before the gain setting has taken effect.  A stop/start of the conversion
     * is done to reset the values.
     * @param gain New programmable gain amplifier level
     * @see ADS1115_PGA_6P144
     * @see ADS1115_PGA_4P096
     * @see ADS1115_PGA_2P048
     * @see ADS1115_PGA_1P024
     * @see ADS1115_PGA_0P512
     * @see ADS1115_PGA_0P256
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_PGA_BIT
     * @see ADS1115_CFG_PGA_LENGTH
     */
    this.setGain = function(gain) {
        if (this.writeBitsW(ADS1115_RA_CONFIG, ADS1115_CFG_PGA_BIT, ADS1115_CFG_PGA_LENGTH, gain)) {
            this.pgaMode = gain;
            if (this.devMode == ADS1115_MODE_CONTINUOUS) {
                // Force a stop/start
                this.setMode(ADS1115_MODE_SINGLESHOT);
                this.getConversion();
                this.setMode(ADS1115_MODE_CONTINUOUS);
            }
        }
    };

    /** Get device mode.
     * @return Current device mode
     * @see ADS1115_MODE_CONTINUOUS
     * @see ADS1115_MODE_SINGLESHOT
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_MODE_BIT
     */
    this.getMode = function() {
        var buffer = new Array(1);
        this.readBitW(ADS1115_RA_CONFIG, ADS1115_CFG_MODE_BIT, buffer);
        this.devMode = buffer[0];
        return devMode;
    };

    /** Set device mode.
     * @param mode New device mode
     * @see ADS1115_MODE_CONTINUOUS
     * @see ADS1115_MODE_SINGLESHOT
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_MODE_BIT
     */
    this.setMode = function(mode) {
        if (this.writeBitW(ADS1115_RA_CONFIG, ADS1115_CFG_MODE_BIT, mode)) {
            this.devMode = mode;
        }
    };

    /** Get data rate.
     * @return Current data rate
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_DR_BIT
     * @see ADS1115_CFG_DR_LENGTH
     */
    this.getRate = function() {
        var buffer = new Array[0];
        this.readBitsW(ADS1115_RA_CONFIG, ADS1115_CFG_DR_BIT, ADS1115_CFG_DR_LENGTH, buffer);
        return buffer[0];
    };

    /** Set data rate.
     * @param rate New data rate
     * @see ADS1115_RATE_8
     * @see ADS1115_RATE_16
     * @see ADS1115_RATE_32
     * @see ADS1115_RATE_64
     * @see ADS1115_RATE_128
     * @see ADS1115_RATE_250
     * @see ADS1115_RATE_475
     * @see ADS1115_RATE_860
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_DR_BIT
     * @see ADS1115_CFG_DR_LENGTH
     */
    this.setRate = function(rate) {
        this.writeBitsW(ADS1115_RA_CONFIG, ADS1115_CFG_DR_BIT, ADS1115_CFG_DR_LENGTH, rate);
    };

    /** Get comparator mode.
     * @return Current comparator mode
     * @see ADS1115_COMP_MODE_HYSTERESIS
     * @see ADS1115_COMP_MODE_WINDOW
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_COMP_MODE_BIT
     */
    this.getComparatorMode = function() {
        var buffer = new Array(1);
        this.readBitW(ADS1115_RA_CONFIG, ADS1115_CFG_COMP_MODE_BIT, buffer);
        return buffer[0];
    };

    /** Set comparator mode.
     * @param mode New comparator mode
     * @see ADS1115_COMP_MODE_HYSTERESIS
     * @see ADS1115_COMP_MODE_WINDOW
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_COMP_MODE_BIT
     */
    this.setComparatorMode = function(mode) {
        this.writeBitW(ADS1115_RA_CONFIG, ADS1115_CFG_COMP_MODE_BIT, mode);
    };

    /** Get comparator polarity setting.
     * @return Current comparator polarity setting
     * @see ADS1115_COMP_POL_ACTIVE_LOW
     * @see ADS1115_COMP_POL_ACTIVE_HIGH
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_COMP_POL_BIT
     */
    this.getComparatorPolarity = function() {
        var buffer = new Array(1);
        this.readBitW(ADS1115_RA_CONFIG, ADS1115_CFG_COMP_POL_BIT, buffer);
        return buffer[0];
    };

    /** Set comparator polarity setting.
     * @param polarity New comparator polarity setting
     * @see ADS1115_COMP_POL_ACTIVE_LOW
     * @see ADS1115_COMP_POL_ACTIVE_HIGH
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_COMP_POL_BIT
     */
    this.setComparatorPolarity = function(polarity) {
        this.writeBitW(ADS1115_RA_CONFIG, ADS1115_CFG_COMP_POL_BIT, polarity);
    };

    /** Get comparator latch enabled value.
     * @return Current comparator latch enabled value
     * @see ADS1115_COMP_LAT_NON_LATCHING
     * @see ADS1115_COMP_LAT_LATCHING
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_COMP_LAT_BIT
     */
    this.getComparatorLatchEnabled = function() {
        var buffer = new Array(1);
        this.readBitW(ADS1115_RA_CONFIG, ADS1115_CFG_COMP_LAT_BIT, buffer);
        return buffer[0];
    };

    /** Set comparator latch enabled value.
     * @param enabled New comparator latch enabled value
     * @see ADS1115_COMP_LAT_NON_LATCHING
     * @see ADS1115_COMP_LAT_LATCHING
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_COMP_LAT_BIT
     */
    this.setComparatorLatchEnabled = function(enabled) {
        this.writeBitW(ADS1115_RA_CONFIG, ADS1115_CFG_COMP_LAT_BIT, enabled);
    };

    /** Get comparator queue mode.
     * @return Current comparator queue mode
     * @see ADS1115_COMP_QUE_ASSERT1
     * @see ADS1115_COMP_QUE_ASSERT2
     * @see ADS1115_COMP_QUE_ASSERT4
     * @see ADS1115_COMP_QUE_DISABLE
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_COMP_QUE_BIT
     * @see ADS1115_CFG_COMP_QUE_LENGTH
     */
    this.getComparatorQueueMode = function() {
        var buffer = new Array(1);
        this.readBitsW(ADS1115_RA_CONFIG, ADS1115_CFG_COMP_QUE_BIT, ADS1115_CFG_COMP_QUE_LENGTH, buffer);
        return buffer[0];
    };

    /** Set comparator queue mode.
     * @param mode New comparator queue mode
     * @see ADS1115_COMP_QUE_ASSERT1
     * @see ADS1115_COMP_QUE_ASSERT2
     * @see ADS1115_COMP_QUE_ASSERT4
     * @see ADS1115_COMP_QUE_DISABLE
     * @see ADS1115_RA_CONFIG
     * @see ADS1115_CFG_COMP_QUE_BIT
     * @see ADS1115_CFG_COMP_QUE_LENGTH
     */
    this.setComparatorQueueMode = function(mode) {
        this.writeBitsW(ADS1115_RA_CONFIG, ADS1115_CFG_COMP_QUE_BIT,
            ADS1115_CFG_COMP_QUE_LENGTH, mode);
    };

    // *_THRESH registers

    /** Get low threshold value.
     * @return Current low threshold value
     * @see ADS1115_RA_LO_THRESH
     */
    this.getLowThreshold = function() {
        var buf = new Array(1);
        this.readWords(ADS1115_RA_LO_THRESH, 1, buf);
        return buf[0];
    };

    /** Set low threshold value.
     * @param threshold New low threshold value
     * @see ADS1115_RA_LO_THRESH
     */
    this.setLowThreshold = function(threshold) {
        this.writeWord(ADS1115_RA_LO_THRESH, threshold);
    };

    /** Get high threshold value.
     * @return Current high threshold value
     * @see ADS1115_RA_HI_THRESH
     */
    this.getHighThreshold = function() {
        var buf = new Array(1);
        this.readWords(ADS1115_RA_HI_THRESH, 1, buf);
        return buf[0];
    };

    /** Set high threshold value.
     * @param threshold New high threshold value
     * @see ADS1115_RA_HI_THRESH
     */
    this.setHighThreshold = function(threshold) {
        this.writeWord(ADS1115_RA_HI_THRESH, threshold);
    };

    /** Configures ALERT/RDY pin as a conversion ready pin.
     *  It does this by setting the MSB of the high threshold register to '1' and the MSB
     *  of the low threshold register to '0'. COMP_POL and COMP_QUE bits will be set to '0'.
     *  Note: ALERT/RDY pin requires a pull up resistor.
     */
    this.setConversionReadyPinMode = function() {
        this.writeBitW(ADS1115_RA_HI_THRESH, 15, 1);
        this.writeBitW(ADS1115_RA_LO_THRESH, 15, 0);
        this.setComparatorPolarity(0);
        this.setComparatorQueueMode(0);
    };

    // Create a mask between two bits
    this.createMask = function(a,b) {
        var mask = 0;
        for (var i = a; i <= b; i++)
            mask |= 1 << i;
        return mask;
    };

    this.shiftDown = function(extractFrom,places) {
        return (extractFrom >> places);
    };

    this.getValueFromBits = function(extractFrom, high, length) {
        var low = high - length + 1;
        var mask = this.createMask(low, high);
        return this.shiftDown(extractFrom & mask, low);
    };

    /**
     * Show all the config register settings
     */
    this.getConfigRegister = function() {
        var buf = new Array(1);
        this.readWords(ADS1115_RA_CONFIG, 1, buf);
        var configRegister = buf[0];
        return {
            "OS": this.getValueFromBits(configRegister, ADS1115_CFG_OS_BIT,1),
            "MUX": this.getValueFromBits(configRegister, ADS1115_CFG_MUX_BIT,ADS1115_CFG_MUX_LENGTH),
            "PGA": this.getValueFromBits(configRegister, ADS1115_CFG_PGA_BIT,ADS1115_CFG_PGA_LENGTH),
            "MODE": this.getValueFromBits(configRegister, ADS1115_CFG_MODE_BIT,1),
            "DR": this.getValueFromBits(configRegister, ADS1115_CFG_DR_BIT,ADS1115_CFG_DR_LENGTH),
            "CMP_MODE": this.getValueFromBits(configRegister, ADS1115_CFG_COMP_MODE_BIT,1),
            "CMP_POL": this.getValueFromBits(configRegister,  ADS1115_CFG_COMP_POL_BIT,1),
            "CMP_LAT": this.getValueFromBits(configRegister, ADS1115_CFG_COMP_LAT_BIT,1),
            "CMP_QUE": this.getValueFromBits(configRegister,  ADS1115_CFG_COMP_QUE_BIT,ADS1115_CFG_COMP_QUE_LENGTH)
        };
    };


    this.readBitsW = function(regAddr, bitStart, length, data) {
        // 1101011001101001 read byte
        // fedcba9876543210 bit numbers
        //    xxx           args: bitStart=12, length=3
        //    010           masked#include <errno.h>
        //           -> 010 shifted
        var count;
        var w = new Array(1);
        if ((count =this.readWords(regAddr, 1, w)) != 0) {
            var mask = ((1 << length) - 1) << (bitStart - length + 1);
            w &= mask;
            w >>= (bitStart - length + 1);
            data[0] = w[0];
        }
        return count;
    }

    this.readBitW = function(regAddr, bitNum, data) {
        var b = new Array(1);
        var count = this.readWords(regAddr, 1, b);
        data[0] = b & (1 << bitNum);
        return count;
    }

    this.readWords = function(regAddr, length, data) {
        var buff = new Array(length * 2);

        if (this.readBytes(regAddr, length * 2, buff) > 0) {
            for (var i = 0; i < length; i++) {
                data[i] = (buff[i * 2] << 8) | buff[i * 2 + 1];
            }
            return length;
        }

        return -1;
    }

    this.readBytes = function(regAddr, length, data) {
        if (isNaN(this.devAddr)) {
            throw 'no initialized for reading';
        }
        var fd = i2c.openSync(i2cChannel, O_RDWR);

        const buf = Buffer.from([regAddr]);
        if (fd.i2cWriteSync(this.devAddr, 1, buf) !== 1) {
            throw 'could not write to select registry at ' + regAddr;
        }

        const rbuf = Buffer.alloc(length);
        if (fd.i2cReadSync(this.devAddr, length, rbuf) != length) {
            throw 'could not read from the selected registry at ' + regAddr;
        }
        for(var i = 0; i<length; i++) {
            data[i] = rbuf[i];
        }
        fd.closeSync();
        return length;
    }

    /** Write multiple bits in a 16-bit device register.
     * @param regAddr Register regAddr to write to
     * @param bitStart First bit position to write (0-15)
     * @param length Number of bits to write (not more than 16)
     * @param data Right-aligned value to write
     * @return Status of operation (true = success)
     */
    this.writeBitsW = function(regAddr, bitStart, length, data) {
        //              010 value to write
        // fedcba9876543210 bit numbers
        //    xxx           args: bitStart=12, length=3
        // 0001110000000000 mask word
        // 1010111110010110 original value (sample)
        // 1010001110010110 original & ~mask
        // 1010101110010110 masked | value
        let w = new Array(1);
        if (this.readWords(regAddr, 1, w) != 0) {
            var mask = ((1 << length) - 1) << (bitStart - length + 1);
            data <<= (bitStart - length + 1); // shift data into correct position
            data &= mask;                     // zero all non-important bits in data
            w &= ~(mask);                // zero all important bits in existing word
            w |= data;                        // combine data with existing word
            return this.writeWord(regAddr, w);
        } else {
            return false;
        }
    }

    this.writeBitW = function(regAddr, bitNum, data) {
        var w = new Array(1);
        this.readWords(regAddr, 1, w);
        w = (data != 0) ? (w | (1 << bitNum)) : (w & ~(1 << bitNum));
        return this.writeWord(regAddr, w);
    }

    this.writeWord = function(regAddr, data) {
        var v = new Array(1);
        v[0] = data;
        return this.writeWords(regAddr, 1, v);
    }

    this.writeWords = function(regAddr, length,	data) {
        var buff = new Array(length * 2);

        for (var i = 0; i < length; i++) {
            buff[2 * i] = (data[i] >> 8);     //MSByte
            buff[1 + 2 * i] = (data[i] >> 0); //LSByte
        }

        return this.writeBytes(regAddr, length * 2, buff);
    }

    this.writeBytes = function(regAddr, length, data) {
        if (isNaN(this.devAddr)) {
            throw 'no initialized for writting';
        }
        var fd = i2c.openSync(i2cChannel, O_RDWR);

        var buff_length = length + 1;
        var buff = new Array(buff_length);
        buff[0] = regAddr;
        for(var i=0; i< length; i++) {
            buff[i+1] = data[i];
        }
        const buf = Buffer.from(buff);

        if (fd.i2cWriteSync(this.devAddr, buff_length, buf) !== buff_length) {
            throw 'could not write to select registry at ' + regAddr;
        }

        fd.closeSync();
        return true;
    }

}

module.exports = ads1115;
