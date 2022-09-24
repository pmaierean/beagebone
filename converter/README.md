# PROJECT DESCRIPTION

This contains sources for a nodejs based Restful webservice that runs on Beaglebone Black board.
It assumes that an ADS1115 16 bits ADC converter is connected to the I2C extension of the broard.

To register the converter to start at boot time of the board take the following steps in command line:

>crontab -e

add to the end of the file: 

@reboot sleep 600 && /var/lib/cloud9/converter/npm run start



Refer to https://opensource.com/article/17/11/how-use-cron-linux 