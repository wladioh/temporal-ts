kubectl port-forward -n kube-system service/kubernetes-dashboard 10443:443 
kubectl port-forward svc/temporaltest-web -n temporal 8081:8080 
kubectl port-forward svc/temporaltest-frontend -n temporal 7233:7233 
k -n kube-system get secret --field-selector metadata.name=$(k -n kube-system get secret | grep default-token | cut -d " " -f1) -o=jsonpath='{.items[0].data.token}' | base64 --decode | pbcopy
# k port-forward svc/web 8084:8084 -n linkerd
#  kubectl annotate namespace temporal linkerd.io/inject=enabled