# Google Scripts
All scripts in this part of the repository are made in Google Script. Google Script is a JavaScript cloud scripting language that provides easy ways to automate tasks across Google products and third party services and build web applications. For more information: https://developers.google.com/apps-script/

<br/>

### Structure
This part of repository consists of several folders.
| Folder | Description |
| ------ | ------ |
| Composed | Scripts that are ready for deployment |
| Libraries | Large chunks of code that is being reused |
| Projects | The folder containing a folder per project|
| Projects > [Project] | All code and files related to a project |

<br/>

### Secrets
All secrets in this project are stored inside a `.env` file. There is a singular `example.env` file for each project. Copy this file and rename it to `.env`. Once you have done this, you can fill this file with secrets. The composer will put the secrets into the correct files.

<b>It is essential that absolutely not a single secret is put into any other file.</b> If you ever accidentally commit a secret, please contact the [IT Crowd](mailto:itcrowd@svsticky.nl) if this happens to make sure the damage is limited.

GitHub will ignore the created `.env` files so all secrets will only be available locally and in the Google project.

If you update any secret, please redeploy the application, since these are not dynamically updated.

<br/>

### Composer
As the [usage of libraries is advised against by Google](https://developers.google.com/apps-script/guides/libraries), a composer has been built that adds the required libraries to the project files.

##### Usage
The composer looks in the code in the projects folder for the keyword ```INSERTLIB [Library]```. An example would be ```INSERLIB Libraries/General.js```.

**Running the script**
This script is based on **Python 2.7**.

Windows: https://docs.python.org/2.7/using/windows.html
Linux/Mac: ```python ComposeProject.py```

<br/>

### Projects
##### Pipedrive
The Pipedrive project pulls deals from Pipedrive and creates contracts and invoices for these in the Google Drive.

##### Notulen
The Notulen project allows to generate agendas, generate and move notetaking files, extract APs and send an email to the advisory board.
