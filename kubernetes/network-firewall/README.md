# Network Firewall Module

The Network Firewall module is used to configure a standard set of [firewall rules](https://cloud.google.com/vpc/docs/firewalls)
for your network created using the [vpc-network](../vpc-network) module.

Firewall rules on Google Cloud Platform (GCP) are created at the network level but act on each instance; if traffic is
restricted between instances by the rule, they will be unable to communicate even if they're in the same network or
subnetwork.

The default firewall rules on GCP block inbound traffic and allow outbound traffic. Firewall rules are stateful; if a
connection is allowed between a source and a target or a target and a destination, all subsequent traffic in either
direction will be allowed as long as the connection is active.

This module adds rules for 4 [network `tags`](https://cloud.google.com/vpc/docs/add-remove-network-tags) that can be
applied to instances, similar to the division between subnetworks.

* `public` - allow inbound traffic from all sources

* `public-restricted` - allow inbound traffic from specific subnetworks on the internet

* `private` - allow inbound traffic from within this network

* `private-persistence` - allow inbound traffic from within this network, excluding instances tagged `public`

Untagged instances will be unable to communicate with any other resources due to the implicit firewall rules.
