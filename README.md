# Project

Manage anime league auctions and listings.
Scrape viewership numbers from multiple sources.

# Rough Spec

Active Auction
* bid
* random through the upcoming anime list
* "set upcoming up"
* bid from points
* set username

Auction Manager (individual running an auction)
* click for result + set winner

Auction Manager TV (auction displayed on a TV)
* Display current trailer in sync
* QR code to join on phone

List (historical)
* scraped data
* graphs
* list of all anime

Create Auction
* modifiers to score
* default to upcoming set
* filter/modify values

Home
* your leagues - multiple
* total score/rating
* profile

Auction
* graphs
* value of all items
* (existing record prices)
* countdown to sync
* view by participant portfolio

Notifications on:
* invite
* episode released
* changes in points (weekly summary)

# Architecture

# Local development

Installing minikube
```
brew install hyperkit
brew install minikube
minikube config set vm-driver hyperkit
```

Starting minikube
```
minikube start --memory=8192 --cpus=6 \
  --kubernetes-version=v1.14.0 \
  --vm-driver=hyperkit \
  --disk-size=30g \
  --extra-config=apiserver.enable-admission-plugins="LimitRanger,NamespaceExists,NamespaceLifecycle,ResourceQuota,ServiceAccount,DefaultStorageClass,MutatingAdmissionWebhook"
```


# Deployment



# Schema
