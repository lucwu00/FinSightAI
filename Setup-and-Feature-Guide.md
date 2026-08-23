Log-in and User Authentication for Add and Delete of Policy Store
admin@example.com
adminpassword

1) Set-up

cp backend/config/google-credentials.json.example backend/config/google-credentials.json


1(a) Backend Set-up with database 

npm install
cd backend
node migrations/run-migration.js
node seed_policy_store.js
node seed_clients.js
node seed_policies.js
npm run dev

1(b)Frontend Running
cd frontend
npm run dev


Zwe (Policy Store, Policies and Import Page)

Policy Store tab flow
- Policies separated in categories of 4
- Can add which requires user authentication
- Can view and edit details of each policy
- Can delete which again requires user authentication
- After adding and deleting the policy which has the direct influence on policies and import pages bc the pages directly fetch the available policies from the store
- Also supplemented with fallback policies in case the system fails

Policies tab flow
- Search by client id as C001 and C002
- Open AI is integrated to generate AI Summary for expired, expiring(within the current year) and duplicate policies
- Complete Client Profile for quick reviewing of client’s personal information without needing to go to other tabs
- Can add and edit (which is restricted if adding the already existing policy name)

Import tab flow
- Upload Excel in the correct format; otherwise will be rejected, and also you can drag and drop
- Automapping logic with all possible entries as excel columns for Database Table Columns
- Preview table with instructions at the bottom
- Approve and Import button remains greyed out until all data entries are fixed and validated through algorithmic logics
- Open AI is integrated to generate the customized validation notes for each row 
- You can also click AI Enhanced button above the table to ensure all rows are validated and AI-integrated (brain icon will turn to robot head icon)
- Refresh Policies button is to ensure all the updated policies from Policy Store are updated in Import page. It will be greyed out if everything is up-to-date
- Click Approve and Import button for successful importing and you can generate csv for record or report. 

Import testing (Attached Import.xlsx)
Existing Clients
- Alex Goh Wei Jie
- Set S7022918E
- Client ID set back to C001

- Amanda Tan Wei Ling
- C002

New Clients
- Tan Hui Min (being repeated and having two different client id, bc he is currently having two different client id)
- Setting the same client id as S9005211Z will reset as the same client id C003

- Fix all data that does not pass validation check


Choon (Meeting Schedule, Help pages)

Meeting Schedule tab flow
- Can add and edit the exact timing of the scheduled meetings
- Have a note box where the financial advisor can quickly sketch while Gen AI is integrated to generate the fully comprehensive text

Help tab flow 
- A quick navigation to the relevant articles from the key words under common questions

arfan (Client, User, Settings)
- get generative reply from ai based off user/client data (click AI analysis)
- filter search for client list (find based off nric, name etc)
- settings allow change of pfp, name, and delete account, export client data. Password not incl

- client list --> make changes to the client data with edit client info (3 dots to the right, client )
-             --> can delete client data (both user and client)
- user list --> can only demote or promote users to admin and user/ cannot edit info remotely

Ken Yew (Dashboard, Client Slides (Integrated into website))
- Modular, dynamic dashboard that gives overview of recommended actions and easy access to querying clients
-   Includes:
-   -   Nudges (Best follow up actions based on client details used generative AI)
-   -   To-do list
-   -   Reccommended Polices (Best policies suited for clients based on policies and clients data, with use of generative ai to give suggestions)
-   -   Top Performing Policies 
-   -   Query Client (Queries client for their individual client-facing slides)
-   -   Schedules Events with clients integrated with Google Calender API
-   -   Quick note functionality attached to each client
Straight forward overview of client's data in a presentation format, presented in various graphical visualisations. Also includes gaps and insights based on client's data by generative ai.
